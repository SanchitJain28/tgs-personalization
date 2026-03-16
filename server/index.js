import "dotenv/config";
import express from "express";
import "@shopify/shopify-api/adapters/node"; 

import cors from "cors";
import { shopifyApi, ApiVersion, Session } from "@shopify/shopify-api";
import { restResources } from "@shopify/shopify-api/rest/admin/2025-01"; 
// 1. Initialize Shopify with updated ApiVersion and hostScheme
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_SCOPES.split(","),
  hostName: process.env.SHOPIFY_HOST.replace(/https?:\/\//, ""),
  hostScheme: process.env.SHOPIFY_HOST.startsWith("https") ? "https" : "http",
  apiVersion: ApiVersion.January25, 
  isEmbeddedApp: false,
  restResources,
});

const app = express();
const PORT = process.env.PORT || 3001;
const SHOP = process.env.SHOP; // e.g. "giftbu-com.myshopify.com"

/* ── In-memory token store (single merchant tool) ─── */
let accessToken = null;

/* ── Middleware ───────────────────────────────────── */
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());

/* ── Auth middleware for protected routes ─────────── */
function requireAuth(req, res, next) {
  const secret = req.headers["x-config-secret"];
  if (secret !== process.env.CONFIG_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!accessToken) {
    return res
      .status(403)
      .json({ error: "Not authenticated with Shopify. Visit /auth first." });
  }
  next();
}

/* ── Helper: Shopify GraphQL request ─────────────── */
/* ── Helper: Shopify GraphQL request ─────────────── */
async function shopifyGraphQL(query, variables = {}) {
  const session = new Session({
    id: `${SHOP}_session`,
    shop: SHOP,
    state: "active",
    isOnline: false,
    accessToken: accessToken,
  });

  const client = new shopify.clients.Graphql({ session });
  
  // Use .request() instead of the deprecated .query()
  const res = await client.request(query, { variables });
  
  // Return the data directly
  return res.data; 
}

/* ══════════════════════════════════════════════════
   OAUTH ROUTES
══════════════════════════════════════════════════ */

/* Step 1 — Start OAuth */
app.get("/auth", async (req, res) => {
  try {
    const authUrl = await shopify.auth.begin({
      shop: SHOP,
      callbackPath: "/auth/callback",
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });
    res.redirect(authUrl);
  } catch (err) {
    console.error("[TGS] Auth begin error:", err);
    res.status(500).send("Failed to start OAuth.");
  }
});

/* Step 2 — OAuth callback */
app.get("/auth/callback", async (req, res) => {
  try {
    const { session } = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    accessToken = session.accessToken;
    console.log("[TGS] OAuth complete. Access token stored.");
    res.send(`
      <html>
        <body style="font-family:sans-serif;padding:40px;background:#F5EFE6;">
          <h2 style="color:#2C1A0E;">✅ Authentication successful</h2>
          <p style="color:#6B5744;">You can now close this tab and use the config tool.</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("[TGS] OAuth error:", err);
    res.status(500).send("OAuth failed: " + err.message);
  }
});

/* Auth status check */
app.get("/auth/status", (req, res) => {
  res.json({ authenticated: !!accessToken });
});

/* ══════════════════════════════════════════════════
   PRODUCT ROUTES
══════════════════════════════════════════════════ */

/* GET /api/products — list all products */
app.get("/api/products", requireAuth, async (req, res) => {
  try {
    const data = await shopifyGraphQL(
      `
      query GetProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              featuredImage {
                url
              }
              metafield(namespace: "custom", key: "is_personalizable") {
                value
              }
            }
          }
        }
      }
    `,
      { first: 50 },
    );

    const products = data.products.edges.map(({ node }) => ({
      id: node.id.split("/").pop(), // Strip gid://shopify/Product/ for cleaner frontend handling
      title: node.title,
      handle: node.handle,
      image: node.featuredImage?.url || null,
      isPersonalizable: node.metafield?.value === "true",
    }));

    res.json({ products });
  } catch (err) {
    console.error("[TGS] Get products error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* GET /api/product/:id/config — get personalization config */
app.get("/api/product/:id/config", requireAuth, async (req, res) => {
  try {
    const gid = `gid://shopify/Product/${req.params.id}`;
    const data = await shopifyGraphQL(
      `
      query GetProductConfig($id: ID!) {
        product(id: $id) {
          id
          title
          featuredImage { url }
          personalizableFlag: metafield(namespace: "custom", key: "is_personalizable") {
            value
          }
          personalizationConfig: metafield(namespace: "custom", key: "personalization_config") {
            value
          }
          previewImage: metafield(namespace: "custom", key: "preview_image") {
            reference {
              ... on MediaImage {
                image { url }
              }
            }
          }
        }
      }
    `,
      { id: gid },
    );

    if (!data.product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = data.product;
    let config = null;

    if (product.personalizationConfig?.value) {
      try {
        config = JSON.parse(product.personalizationConfig.value);
      } catch {
        config = null;
      }
    }

    res.json({
      id: product.id.split("/").pop(),
      title: product.title,
      image: product.featuredImage?.url || null,
      previewImage: product.previewImage?.reference?.image?.url || null,
      isPersonalizable: product.personalizableFlag?.value === "true",
      config: config || {
        fields: [],
        textColor: "C49A3C",
        fontSize: 60,
        fontFamily: "Cormorant Garamond",
        gravity: "south",
      },
    });
  } catch (err) {
    console.error("[TGS] Get config error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/product/:id/config — save personalization config */
app.post("/api/product/:id/config", requireAuth, async (req, res) => {
  try {
    const gid = `gid://shopify/Product/${req.params.id}`;
    const { config, isPersonalizable } = req.body;

    if (!config) return res.status(400).json({ error: "config is required" });

    const metafields = [
      {
        ownerId: gid,
        namespace: "custom",
        key: "personalization_config",
        value: JSON.stringify(config),
        type: "json",
      },
      {
        ownerId: gid,
        namespace: "custom",
        key: "is_personalizable",
        value: String(!!isPersonalizable),
        type: "boolean",
      },
    ];

    const data = await shopifyGraphQL(
      `
      mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
      { metafields },
    );

    const errors = data.metafieldsSet.userErrors;
    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0].message });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[TGS] Save config error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ── Health check ─────────────────────────────────── */
app.get("/health", (req, res) => {
  res.json({ ok: true, authenticated: !!accessToken });
});

/* ── Start ────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`[TGS] Server running on port ${PORT}`);
  console.log(`[TGS] To authenticate, visit: ${process.env.SHOPIFY_HOST}/auth`);
});
