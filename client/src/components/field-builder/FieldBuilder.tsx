import { useState, useCallback, useEffect } from "react";
import "./FieldBuilder.css";
import {
  type Field,
  type TextField,
  type ImageField,
  DEFAULT_TEXT_FIELD,
  DEFAULT_IMAGE_FIELD,
} from "../../types";

const PRESET_FONTS = [
  "Arial",
  "Roboto",
  "Open Sans",
  "Montserrat",
  "Lato",
  "Playfair Display",
  "Dancing Script",
  "Pacifico",
  "Abril Fatface",
  "Cinzel",
  "EB Garamond",
  "Great Vibes",
  "Oswald",
  "Raleway",
  "Josefin Sans",
];
const FONT_WEIGHTS = ["normal", "bold", "light", "thin"];
const FONT_STYLES = ["normal", "italic"];
const DECORATIONS = ["none", "underline", "strikethrough"];
const ALIGNMENTS = ["left", "center", "right"];

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cloudinary: any;
  }
}

interface FieldBuilderProps {
  fields: Field[];
  previewImage: string | null;
  onChange: (fields: Field[]) => void;
}

export default function FieldBuilder({
  fields,
  previewImage,
  onChange,
}: FieldBuilderProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  function addField(type: "text" | "image") {
    const newField =
      type === "text" ? { ...DEFAULT_TEXT_FIELD } : { ...DEFAULT_IMAGE_FIELD };
    onChange([...fields, newField]);
    setExpanded(fields.length);
  }

  function removeField(idx: number) {
    onChange(fields.filter((_, i) => i !== idx));
    if (expanded === idx) setExpanded(null);
  }

  function updateField(idx: number, patch: Partial<Field>) {
    onChange(
      fields.map((f, i) => (i === idx ? ({ ...f, ...patch } as Field) : f)),
    );
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

  useEffect(() => {
    if (!document.getElementById("cloudinary-widget-script")) {
      const script = document.createElement("script");
      script.id = "cloudinary-widget-script";
      script.src = "https://upload-widget.cloudinary.com/global/all.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="fb">
      {fields.length === 0 && (
        <p className="fb-empty">No fields yet. Add one below.</p>
      )}

      {fields.map((field, idx) => (
        <div
          key={idx}
          className={`fb-field ${expanded === idx ? "is-expanded" : ""}`}
        >
          {/* Field header */}
          <div
            className="fb-field-header"
            onClick={() => setExpanded(expanded === idx ? null : idx)}
          >
            <div className="fb-field-left">
              <span className="fb-field-badge">{field.type}</span>
              <span className="fb-field-label">
                {field.label || <em>Untitled</em>}
              </span>
            </div>
            <div
              className="fb-field-actions"
              onClick={(e) => e.stopPropagation()}
            >
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
              <button className="fb-expand-btn">
                {expanded === idx ? "▲" : "▼"}
              </button>
            </div>
          </div>

          {/* Expanded editor */}
          {expanded === idx && (
            <div className="fb-field-body">
              {/* Common: label */}
              <div className="fb-row">
                <div className="fb-group fb-group--grow">
                  <label>Label</label>
                  <input
                    type="text"
                    name="fieldLabel"
                    title="Field label"
                    value={field.label}
                    placeholder="e.g. Name"
                    onChange={(e) =>
                      updateField(idx, { label: e.target.value })
                    }
                  />
                </div>

                {field.type === "text" && (
                  <div className="fb-group">
                    <label>Max chars</label>
                    <input
                      type="number"
                      name="maxChars"
                      title="Maximum characters"
                      value={(field as TextField).maxChars}
                      min={1}
                      max={200}
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
                    name="placeholder"
                    title="Placeholder text"
                    value={(field as TextField).placeholder}
                    placeholder="e.g. Enter your name"
                    onChange={(e) =>
                      updateField(idx, { placeholder: e.target.value })
                    }
                  />
                </div>
              )}

              <div className="fb-divider" />

              {/* Position picker */}
              <FieldPositionPicker
                field={field}
                previewImage={previewImage}
                onUpdate={(patch) => updateField(idx, patch)}
              />

              {/* Text style */}
              {field.type === "text" && (
                <>
                  <div className="fb-divider" />
                  <TextFieldStyleEditor
                    field={field as TextField}
                    onUpdate={(patch) => updateField(idx, patch)}
                  />
                </>
              )}

              {/* Image size */}
              {field.type === "image" && (
                <>
                  <div className="fb-divider" />
                  <ImageFieldSizeEditor
                    field={field as ImageField}
                    onUpdate={(patch) => updateField(idx, patch)}
                  />
                </>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add buttons */}
      <div className="fb-add-row">
        <button className="fb-add" onClick={() => addField("text")}>
          + Text Field
        </button>
        <button className="fb-add" onClick={() => addField("image")}>
          + Image Field
        </button>
      </div>
    </div>
  );
}

/* ── Per-field position picker ─────────────────────── */
function FieldPositionPicker({
  field,
  previewImage,
  onUpdate,
}: {
  field: Field;
  previewImage: string | null;
  onUpdate: (patch: Partial<Field>) => void;
}) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      /* Clamp to image bounds to be safe */
      if (
        clickX < 0 ||
        clickY < 0 ||
        clickX > rect.width ||
        clickY > rect.height
      )
        return;

      const x = Math.round((clickX / rect.width) * 100);
      const y = Math.round((clickY / rect.height) * 100);
      onUpdate({ xPercent: x, yPercent: y });
    },
    [onUpdate],
  );

  const xPercent = field.xPercent;
  const yPercent = field.yPercent;

  return (
    <div className="fb-pos">
      <p className="fb-sub-label">Position — click image to place</p>
      {previewImage ? (
        <>
          <div className="fb-pos-img-wrap" onClick={handleClick}>
            <img src={previewImage} alt="position preview" draggable={false} />
            <div
              className="fb-pos-marker"
              style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
            >
              <div className="fb-pos-dot" />
              <div className="fb-pos-ring" />
              <span className="fb-pos-field-label">
                {field.label || field.type}
              </span>
            </div>
          </div>
          <div className="fb-pos-coords">
            <span>
              X: <strong>{xPercent}%</strong>
            </span>
            <span>
              Y: <strong>{yPercent}%</strong>
            </span>
          </div>
        </>
      ) : (
        <p className="fb-pos-no-image">
          Set <code>custom.preview_image</code> on this product to enable click
          positioning.
        </p>
      )}
    </div>
  );
}

/* ── Per-field text style editor ──────────────────── */
function TextFieldStyleEditor({
  field,
  onUpdate,
}: {
  field: TextField;
  onUpdate: (patch: Partial<TextField>) => void;
}) {
  const [customFont, setCustomFont] = useState("");
  const [fontList, setFontList] = useState(PRESET_FONTS);

  function addFont() {
    const f = customFont.trim();
    if (!f || fontList.includes(f)) return;
    setFontList((prev) => [f, ...prev]);
    onUpdate({ fontFamily: f });
    setCustomFont("");
  }

  function chip<T extends string>(
    key: keyof TextField,
    options: T[],
    current: string,
  ) {
    return (
      <div className="fb-chip-row">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            className={`fb-chip ${current === o ? "is-active" : ""}`}
            onClick={() => onUpdate({ [key]: o } as Partial<TextField>)}
          >
            {o}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="fb-style">
      <p className="fb-sub-label">Text Style</p>

      <div className="fb-style-grid">
        {/* Color */}
        <div className="fb-group fb-group--wide">
          <label>Color</label>
          <div className="fb-color-row">
            <input
              type="color"
              name="textColor"
              title="Text color"
              value={`#${field.textColor}`}
              onChange={(e) =>
                onUpdate({ textColor: e.target.value.replace("#", "") })
              }
            />
            <span className="fb-hex">#{field.textColor}</span>
          </div>
        </div>

        {/* Font family */}
        <div className="fb-group fb-group--wide">
          <label>Font Family</label>
          <select
            name="fontFamily"
            title="Font family"
            value={field.fontFamily}
            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
          >
            {fontList.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <div className="fb-custom-font-row">
            <input
              type="text"
              name="customFont"
              title="Add custom Google Font"
              placeholder="Add Google Font e.g. Lora"
              value={customFont}
              onChange={(e) => setCustomFont(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFont()}
            />
            <button type="button" onClick={addFont}>
              Add
            </button>
          </div>
        </div>

        {/* Font size */}
        <div className="fb-group fb-group--wide">
          <label>Font Size — {field.fontSize}px</label>
          <input
            type="range"
            name="fontSize"
            title="Font size"
            min={14}
            max={200}
            value={field.fontSize}
            onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
          />
        </div>

        {/* Weight */}
        <div className="fb-group fb-group--wide">
          <label>Weight</label>
          {chip("fontWeight", FONT_WEIGHTS, field.fontWeight)}
        </div>

        {/* Style */}
        <div className="fb-group">
          <label>Style</label>
          {chip("fontStyle", FONT_STYLES, field.fontStyle)}
        </div>

        {/* Decoration */}
        <div className="fb-group">
          <label>Decoration</label>
          {chip("textDecoration", DECORATIONS, field.textDecoration)}
        </div>

        {/* Alignment */}
        <div className="fb-group fb-group--wide">
          <label>Alignment</label>
          {chip("textAlign", ALIGNMENTS, field.textAlign)}
        </div>

        {/* Letter spacing */}
        <div className="fb-group">
          <label>Letter Spacing — {field.letterSpacing}</label>
          <input
            type="range"
            name="letterSpacing"
            title="Letter spacing"
            min={-10}
            max={30}
            value={field.letterSpacing}
            onChange={(e) =>
              onUpdate({ letterSpacing: Number(e.target.value) })
            }
          />
        </div>

        {/* Line spacing */}
        <div className="fb-group">
          <label>Line Spacing — {field.lineSpacing}</label>
          <input
            type="range"
            name="lineSpacing"
            title="Line spacing"
            min={-20}
            max={60}
            value={field.lineSpacing}
            onChange={(e) => onUpdate({ lineSpacing: Number(e.target.value) })}
          />
        </div>
      </div>

      {/* CSS preview */}
      <div
        className="fb-font-preview"
        style={{
          fontFamily: field.fontFamily,
          color: `#${field.textColor}`,
          fontWeight: field.fontWeight as React.CSSProperties["fontWeight"],
          fontStyle: field.fontStyle as React.CSSProperties["fontStyle"],
          textDecoration:
            field.textDecoration === "none" ? "none" : field.textDecoration,
          letterSpacing: `${field.letterSpacing}px`,
          fontSize: `${Math.min(field.fontSize * 0.35, 36)}px`,
        }}
      >
        {field.label || "Preview"}
      </div>
    </div>
  );
}

/* ── Image field size editor ──────────────────────── */
function ImageFieldSizeEditor({
  field,
  onUpdate,
}: {
  field: ImageField;
  onUpdate: (patch: Partial<ImageField>) => void;
}) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  function handleUpload() {
    if (!window.cloudinary) {
      alert(
        "Cloudinary widget is still loading. Please try again in a moment.",
      );
      return;
    }

    if (!cloudName || !uploadPreset) {
      alert(
        "Missing Cloudinary environment variables (Cloud Name or Upload Preset).",
      );
      return;
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        sources: ["local", "url", "camera"],
        multiple: false,
        clientAllowedFormats: ["png", "jpeg", "jpg", "webp"],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          console.log(
            "[TGS Debug] Uploaded Image Public ID:",
            result.info.public_id,
          );
          onUpdate({ samplePublicId: result.info.public_id });
        }
      },
    );

    widget.open();
  }

  return (
    <div className="fb-style">
      <p className="fb-sub-label">Image Configuration</p>

      <div className="fb-group">
        <label>Test Image (For Preview)</label>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleUpload}
            style={{
              padding: "8px 16px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {field.samplePublicId ? "Change Test Image" : "Upload Test Image"}
          </button>
          {field.samplePublicId && (
            <span style={{ fontSize: "12px", color: "var(--gold)" }}>
              ✓ Image loaded
            </span>
          )}
        </div>
      </div>

      <div className="fb-group" style={{ marginTop: "12px" }}>
        <label>Width — {field.widthPercent}% of product image</label>
        <input
          type="range"
          name="widthPercent"
          title="Image width percentage"
          min={5}
          max={100}
          value={field.widthPercent}
          onChange={(e) => onUpdate({ widthPercent: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}