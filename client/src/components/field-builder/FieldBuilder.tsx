import "./FieldBuilder.css";

export interface Field {
  type: string;
  label: string;
  maxChars?: number;
  placeholder?: string;
}

interface FieldBuilderProps {
  fields: Field[];
  onChange: (fields: Field[]) => void;
}

const FIELD_TYPES = ["text", "image"];

export default function FieldBuilder({ fields, onChange }: FieldBuilderProps) {
  function addField() {
    onChange([
      ...fields,
      { type: "text", label: "", maxChars: 30, placeholder: "" },
    ]);
  }

  function removeField(idx: number) {
    onChange(fields.filter((_, i) => i !== idx));
  }

  function updateField(idx: number, patch: Partial<Field>) {
    onChange(fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...fields];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  }

  function moveDown(idx: number) {
    if (idx === fields.length - 1) return;
    const next = [...fields];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
  }

  return (
    <div className="fb">
      {fields.length === 0 && (
        <p className="fb-empty">No fields yet. Add one below.</p>
      )}

      {fields.map((field, idx) => (
        <div key={idx} className="fb-field">
          <div className="fb-field-top">
            <span className="fb-field-num">{idx + 1}</span>
            <div className="fb-field-actions">
              <button
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                title="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => moveDown(idx)}
                disabled={idx === fields.length - 1}
                title="Move down"
              >
                ↓
              </button>
              <button
                onClick={() => removeField(idx)}
                className="fb-remove"
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="fb-row">
            <div className="fb-group">
              <label>Type</label>
              <select
                name="feild"
                title="feild"
                value={field.type}
                onChange={(e) => updateField(idx, { type: e.target.value })}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="fb-group fb-group--grow">
              <label>Label</label>
              <input
                type="text"
                value={field.label}
                placeholder="e.g. Name"
                onChange={(e) => updateField(idx, { label: e.target.value })}
              />
            </div>

            {field.type === "text" && (
              <div className="fb-group">
                <label>Max chars</label>
                <input
                  name="maxchars"
                  title="maxchars"
                  type="number"
                  value={field.maxChars}
                  min={1}
                  max={100}
                  onChange={(e) =>
                    updateField(idx, { maxChars: Number(e.target.value) })
                  }
                />
              </div>
            )}
          </div>

          {field.type === "text" && (
            <div className="fb-group">
              <label>Placeholder</label>
              <input
                type="text"
                value={field.placeholder || ""}
                placeholder="e.g. Enter your name"
                onChange={(e) =>
                  updateField(idx, { placeholder: e.target.value })
                }
              />
            </div>
          )}
        </div>
      ))}

      <button className="fb-add" onClick={addField}>
        + Add Field
      </button>
    </div>
  );
}
