import { useState, useEffect, useRef } from "react";
import "./ConfigEditor.css";
import { getProductConfig, saveProductConfig } from "../../api";
import FieldBuilder from "../field-builder/FieldBuilder";
import {
  type PersonalizationConfig,
  type ProductDetails,
  type TextField,
  type ImageField,
  DEFAULT_CONFIG,
} from "../../types";

const CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string) || "";

interface ConfigEditorProps {
  productId: string;
  onSaved?: () => void;
}

/* ── Build full Cloudinary composite URL ─────────── */
function buildCompositeUrl(
  config: PersonalizationConfig,
  previewImageUrl: string,
): string {
  if (!CLOUD_NAME || !previewImageUrl || !config.fields.length) {
    console.warn(
      "[TGS Debug] Missing Cloud Name, Preview Image, or Fields. Aborting.",
    );
    return "";
  }

  const absoluteUrl = previewImageUrl.startsWith("//")
    ? "https:" + previewImageUrl
    : previewImageUrl;

  const layers = config.fields
    .map((field, index) => {
      try {
        if (field.type === "text") {
          const f = field as TextField;

          let font = (f.fontFamily || "Arial").replace(/ /g, "%20");
          const isCustomFont = /\.(ttf|otf|woff2)$/i.test(font);

          if (isCustomFont) {
            font = font.replace(/\//g, ":");
          }

          const color = (f.textColor || "C49A3C").replace("#", "");
          const textContent = (f.label || "SAMPLE").trim() || "SAMPLE";

          const weight =
            !isCustomFont && f.fontWeight !== "normal"
              ? `_${f.fontWeight}`
              : "";
          const italic =
            !isCustomFont && f.fontStyle === "italic" ? "_italic" : "";
          const decoration =
            f.textDecoration !== "none" ? `_${f.textDecoration}` : "";

          // 1. Applies internal alignment (_center, _right)
          const align = f.textAlign !== "left" ? `_${f.textAlign}` : "";

          const lspacing = f.letterSpacing
            ? `_letter_spacing_${f.letterSpacing}`
            : "";
          const linespace = f.lineSpacing
            ? `_line_spacing_${f.lineSpacing}`
            : "";

          const textStyle = `${font}_${f.fontSize}${weight}${italic}${decoration}${align}${lspacing}${linespace}`;
          const encoded = encodeURIComponent(
            textContent.toUpperCase().replace(/,/g, "%2C"),
          );

          // 2 & 3. Combine Gravity with your c_fit + w_ logic
          let gravity = "g_north_west";
          let xStr = (f.xPercent / 100).toFixed(4);
          const yStr = (f.yPercent / 100).toFixed(4);
          let safeWidth = 1.0; // Default to 100% width

          if (f.textAlign === "center") {
            gravity = "g_north"; // Anchor top-center of the text box
            xStr = (f.xPercent / 100 - 0.5).toFixed(4);

            // Auto-calculate bounding box: Distance to nearest edge * 2
            safeWidth = (Math.min(f.xPercent, 100 - f.xPercent) * 2) / 100;
          } else if (f.textAlign === "right") {
            gravity = "g_north_east"; // Anchor top-right of the text box
            xStr = (1 - f.xPercent / 100).toFixed(4);

            // Max width is distance from left edge to anchor
            safeWidth = f.xPercent / 100;
          } else {
            // Left
            gravity = "g_north_west"; // Anchor top-left of the text box

            // Max width is distance from anchor to right edge
            safeWidth = (100 - f.xPercent) / 100;
          }

          const layer = [
            `co_rgb:${color}`,
            `l_text:${textStyle}:${encoded}`,
            `c_fit`, // <--- Forces word wrapping within the box
            `w_${safeWidth.toFixed(4)}`, // <--- Sets the boundary box dynamically
            `fl_relative`,
            gravity,
            `x_${xStr}`,
            `y_${yStr}`,
          ].join(",");

          console.log(`[TGS Debug] Layer ${index} (Text):`, layer);
          return layer;
        }

        if (field.type === "image") {
          const f = field as ImageField;

          const publicId = (f.samplePublicId || "sample").replace(/\//g, ":");

          const baseTransformations = [];

          if (f.cropCoordinates) {
            baseTransformations.push(
              `x_${f.cropCoordinates.x}`,
              `y_${f.cropCoordinates.y}`,
              `w_${f.cropCoordinates.width}`,
              `h_${f.cropCoordinates.height}`,
              `c_crop`,
            );
          }

          // 2. Then, scale and fit the image into the MERCHANT-DEFINED area
          // We use c_fill to ensure the photo always fills the box, cropping excess.
          baseTransformations.push(
            `c_fill`,
            `w_${(f.areaWidth / 100).toFixed(4)}`,
            `h_${(f.areaHeight / 100).toFixed(4)}`,
            `fl_relative`,
          );

          const radius =
            f.borderRadius && f.borderRadius !== "none"
              ? `r_${f.borderRadius}`
              : "";
          if (radius) baseTransformations.push(radius);

          const baseTransformString = baseTransformations
            .filter(Boolean)
            .join(",");

          // 3. Apply optional shape mask
          let maskLayer = "";
          if (f.maskPublicId) {
            const maskId = f.maskPublicId.replace(/\//g, ":");
            maskLayer = `/l_${maskId}/c_scale,w_1.0,h_1.0,fl_region_relative/fl_layer_apply,fl_cutter`;
          }

          // 4. Apply final rotation and positioning OF THE ENTIRE BOX
          const angle = f.rotationAngle ? `a_${f.rotationAngle}` : "";
          const positioning = [
            angle,
            `g_north_west`,
            `x_${(f.areaX / 100).toFixed(4)}`,
            `y_${(f.areaY / 100).toFixed(4)}`,
            `fl_layer_apply`,
          ]
            .filter(Boolean)
            .join(",");

          const layer = `l_${publicId}/${baseTransformString}${maskLayer}/${positioning}`;

          console.log(`[TGS Debug] Final Image Layer:`, layer);
          return layer;
        }

        return null;
      } catch (err) {
        console.error(`[TGS Debug] Error building layer ${index}:`, err);
        return null;
      }
    })
    .filter(Boolean)
    .join("/");

  if (!layers) {
    console.warn("[TGS Debug] No valid layers generated.");
    return "";
  }

  const finalUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/${layers}/f_auto,q_auto/${encodeURIComponent(absoluteUrl)}`;
  console.log("[TGS Debug] Final URL:", finalUrl);
  return finalUrl;
}

export default function ConfigEditor({
  productId,
  onSaved,
}: ConfigEditorProps) {
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [config, setConfig] = useState<PersonalizationConfig>(DEFAULT_CONFIG);
  const [isPersonalizable, setIsPersonalizable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSaved(false);
    getProductConfig(productId)
      .then((data: ProductDetails) => {
        setProduct(data);
        setConfig(data.config || DEFAULT_CONFIG);
        setIsPersonalizable(data.isPersonalizable);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    const imageUrl = product?.previewImage || product?.image;

    if (!imageUrl) {
      setPreviewUrl(null);
      return;
    }
    if (!config.fields.length) {
      setPreviewUrl(imageUrl); // Show base image if no fields
      return;
    }

    if (previewTimer.current) clearTimeout(previewTimer.current);

    previewTimer.current = setTimeout(() => {
      const url = buildCompositeUrl(config, imageUrl);
      if (!url) {
        setPreviewUrl(imageUrl);
        return;
      }

      setPreviewLoading(true);
      const img = new Image();
      img.onload = () => {
        setPreviewUrl(url);
        setPreviewLoading(false);
      };
      img.onerror = () => {
        // Fallback to base image if Cloudinary request fails (e.g. invalid font)
        setPreviewUrl(imageUrl);
        setPreviewLoading(false);
      };
      img.src = url;
    }, 800);

    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, [config, product]);

  function updateConfig(patch: Partial<PersonalizationConfig>) {
    setConfig((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await saveProductConfig(productId, { config, isPersonalizable });
      setSaved(true);
      onSaved?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="ce-loading">
        <div className="spinner" />
        <p>Loading product config…</p>
      </div>
    );
  }

  if (error && !product) return <div className="ce-error">{error}</div>;

  const previewImage = product?.previewImage || product?.image || null;

  return (
    <div className="ce">
      {/* Header */}
      <div className="ce-header">
        <div>
          <h1 className="ce-title">{product?.title}</h1>
          <p className="ce-subtitle">Personalisation Configuration</p>
        </div>
        <div className="ce-header-actions">
          <label className="ce-toggle">
            <input
              type="checkbox"
              name="isPersonalizable"
              title="Enable personalisation"
              checked={isPersonalizable}
              onChange={(e) => {
                setIsPersonalizable(e.target.checked);
                setSaved(false);
              }}
            />
            <span>Enable personalisation</span>
          </label>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save Changes"}
          </button>
        </div>
      </div>

      {error && <div className="ce-error-inline">{error}</div>}

      {!isPersonalizable && (
        <div className="ce-disabled-notice">
          Personalisation is disabled. Enable above to configure.
        </div>
      )}

      <div className={`ce-body ${!isPersonalizable ? "is-disabled" : ""}`}>
        {/* Left — fields */}
        <div className="ce-left">
          <section className="ce-section">
            <h2 className="ce-section-title">Personalisation Fields</h2>
            <p className="ce-section-desc">
              Each field has its own position, style, and size. Click a field to
              expand and configure it.
            </p>
            <FieldBuilder
              fields={config.fields}
              previewImage={previewImage}
              onChange={(fields) => updateConfig({ fields })}
            />
          </section>
        </div>

        {/* Right — live composite preview */}
        <div className="ce-right">
          <section className="ce-section ce-section--sticky">
            <h2 className="ce-section-title">Composite Preview</h2>
            <p className="ce-section-desc">
              Shows all fields composited on the product image as they will
              appear.
            </p>
            <div className="ce-preview-wrap">
              {previewLoading && (
                <div className="ce-preview-loader">
                  <div className="spinner" />
                </div>
              )}
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Composite preview"
                  className={`ce-preview-img ${previewLoading ? "is-loading" : ""}`}
                />
              )}
              {!previewUrl && !previewLoading && (
                <div className="ce-preview-empty">
                  {previewImage
                    ? "Add fields to see composite preview"
                    : "Set preview_image metafield on this product"}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
