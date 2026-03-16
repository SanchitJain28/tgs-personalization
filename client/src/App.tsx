import { useState, useEffect } from "react";
import { checkAuthStatus, getProducts, AUTH_URL } from "./api"; 
import "./App.css";
import ProductList, {
  type ProductListItem,
} from "./components/product-list/ProductList"; // 
import ConfigEditor from "./components/config-editor/ConfigEditor"; 

export default function App() {
  // Added TypeScript generics to state
  const [authStatus, setAuthStatus] = useState<boolean | null>(null);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingProds, setLoadingProds] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /* Check auth on mount */
  useEffect(() => {
    checkAuthStatus()
      .then((data: { authenticated: boolean }) =>
        setAuthStatus(data.authenticated),
      )
      .catch(() => setAuthStatus(false));
  }, []);

  /* Load products once authenticated */
  useEffect(() => {
    if (!authStatus) return;
    getProducts()
      .then((data: { products: ProductListItem[] }) =>
        setProducts(data.products),
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .catch((err: any) => setError(err.message))
      .finally(() => setLoadingProds(false));
  }, [authStatus]);

  /* ── Loading ── */
  if (authStatus === null) {
    return (
      <div className="app-center">
        <div className="spinner" />
        <p>Connecting…</p>
      </div>
    );
  }

  /* ── Not authenticated ── */
  if (!authStatus) {
    return (
      <div className="app-center">
        <div className="auth-card">
          <h1>TGS Config Tool</h1>
          <p>Authenticate with your Shopify store to continue.</p>
          <a
            className="btn-primary"
            href={AUTH_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Connect to Shopify →
          </a>
          <button
            className="btn-secondary"
            onClick={() =>
              checkAuthStatus().then((d: { authenticated: boolean }) =>
                setAuthStatus(d.authenticated),
              )
            }
          >
            I've authenticated — refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">TGS</span>
          <span className="sidebar-title">Personalization Config</span>
        </div>
        {error && <div className="error-banner">{error}</div>}
        <ProductList
          products={products}
          loading={loadingProds}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </aside>

      {/* Main */}
      <main className="app-main">
        {selectedId ? (
          <ConfigEditor productId={extractId(selectedId)} onSaved={() => {}} />
        ) : (
          <div className="app-empty">
            <p>← Select a product to configure personalisation</p>
          </div>
        )}
      </main>
    </div>
  );
}

/* Extract numeric ID from GID */
// Added string type to param and return value
function extractId(gid: string): string {
  return gid.replace("gid://shopify/Product/", "");
}
