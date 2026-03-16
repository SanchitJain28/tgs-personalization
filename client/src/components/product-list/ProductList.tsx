import "./ProductList.css";

export interface ProductListItem {
  id: string;
  title: string;
  image: string | null;
  isPersonalizable: boolean;
}

interface ProductListProps {
  products: ProductListItem[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ProductList({
  products,
  loading,
  selectedId,
  onSelect,
}: ProductListProps) {
  if (loading) {
    return (
      <div className="prodlist-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="prodlist">
      <p className="prodlist-count">{products.length} products</p>
      {products.map((p) => (
        <button
          key={p.id}
          className={`prodlist-item ${selectedId === p.id ? "is-active" : ""}`}
          onClick={() => onSelect(p.id)}
        >
          {p.image && (
            <img
              className="prodlist-img"
              src={p.image}
              alt={p.title}
              width={40}
              height={40}
            />
          )}
          <div className="prodlist-info">
            <span className="prodlist-title">{p.title}</span>
            {p.isPersonalizable && (
              <span className="prodlist-badge">Personalizable</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
