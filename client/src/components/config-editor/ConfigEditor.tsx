import { useState, useEffect } from "react";
import "./ConfigEditor.css";
import { getProductConfig, saveProductConfig } from "../../api";
import TextStyleEditor from "../text-style-editor/TextStyleEditor";
import PositionPicker from "../position-picker/PositionPicker";
import FieldBuilder, { type Field } from "../field-builder/FieldBuilder";

export interface PersonalizationConfig {
  fields: Field[];
  textColor: string;
  fontSize: number;
  fontFamily: string;
  gravity: string;
}

export interface ProductDetails {
  id: string;
  title: string;
  image: string | null;
  previewImage: string | null;
  isPersonalizable: boolean;
  config: PersonalizationConfig | null;
}

const DEFAULT_CONFIG: PersonalizationConfig = {
  fields: [],
  textColor: "C49A3C",
  fontSize: 60,
  fontFamily: "Arial",
  gravity: "south",
};

interface ConfigEditorProps {
  productId: string;
  onSaved?: () => void;
}

export default function ConfigEditor({
  productId,
  onSaved,
}: ConfigEditorProps) {
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [config, setConfig] = useState<PersonalizationConfig>(DEFAULT_CONFIG);
  const [isPersonalizable, setIsPersonalizable] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  if (error && !product) {
    return <div className="ce-error">{error}</div>;
  }

  return (
    <div className="ce">
      <div className="ce-header">
        <div>
          <h1 className="ce-title">{product?.title}</h1>
          <p className="ce-subtitle">Personalisation Configuration</p>
        </div>
        <div className="ce-header-actions">
          <label className="ce-toggle">
            <input
              type="checkbox"
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
          Personalisation is disabled for this product. Enable it above to
          configure.
        </div>
      )}

      <div className={`ce-body ${!isPersonalizable ? "is-disabled" : ""}`}>
        <div className="ce-left">
          <section className="ce-section">
            <h2 className="ce-section-title">Input Fields</h2>
            <p className="ce-section-desc">
              Define what customers can personalise — text or image upload.
            </p>
            <FieldBuilder
              fields={config.fields}
              onChange={(fields) => updateConfig({ fields })}
            />
          </section>

          <section className="ce-section">
            <h2 className="ce-section-title">Text Style</h2>
            <p className="ce-section-desc">
              Controls how personalised text appears on the product preview.
            </p>
            <TextStyleEditor
              config={config}
              onChange={(newConfig) => updateConfig(newConfig)}
            />
          </section>
        </div>

        <div className="ce-right">
          <section className="ce-section">
            <h2 className="ce-section-title">Text Position</h2>
            <p className="ce-section-desc">
              Where should the text appear on the product?
            </p>
            <PositionPicker
              config={config}
              onChange={(newConfig) => updateConfig(newConfig)}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
