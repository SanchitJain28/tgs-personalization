import { useState, useCallback, useEffect } from "react";
import "./FieldBuilder.css";
import {
  type Field,
  type TextField,
  type ImageField,
  DEFAULT_TEXT_FIELD,
  DEFAULT_IMAGE_FIELD,
} from "../../types";
import InteractiveAreaSelector from "../interactive-area-selector/InteractiveAreaSelector";

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
              {field.type === "image" && (
                <InteractiveAreaSelector
                  field={field as ImageField}
                  previewImage={previewImage}
                  onUpdate={(patch) => updateField(idx, patch)}
                />
              )}

              {field.type === "text" && (
                <FieldPositionPicker
                  field={field as TextField} 
                  previewImage={previewImage}
                  onUpdate={(patch) => updateField(idx, patch)}
                />
              )}

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
                  <ImageFieldConfigEditor
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
          <div
            className="fb-pos-coords"
            style={{ display: "flex", alignItems: "center", width: "100%" }}
          >
            <span style={{ minWidth: "50px" }}>
              X: <strong>{xPercent}%</strong>
            </span>
            <span style={{ minWidth: "50px" }}>
              Y: <strong>{yPercent}%</strong>
            </span>

            <div className="fb-pos-nudges">
              <button
                type="button"
                onClick={() =>
                  onUpdate({ yPercent: Math.max(0, yPercent - 1) })
                }
                title="Move Up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdate({ yPercent: Math.min(100, yPercent + 1) })
                }
                title="Move Down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdate({ xPercent: Math.max(0, xPercent - 1) })
                }
                title="Move Left"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdate({ xPercent: Math.min(100, xPercent + 1) })
                }
                title="Move Right"
              >
                →
              </button>
            </div>
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

function TextFieldStyleEditor({
  field,
  onUpdate,
}: {
  field: TextField;
  onUpdate: (patch: Partial<TextField>) => void;
}) {
  const [customFont, setCustomFont] = useState("");
  
  // 1. Initialize fontList from localStorage + Preset Fonts
  const [fontList, setFontList] = useState<string[]>(() => {
    const savedFonts = localStorage.getItem("tgs_custom_fonts");
    if (savedFonts) {
      try {
        const parsed = JSON.parse(savedFonts);
        // Combine saved custom fonts with presets, removing duplicates
        return Array.from(new Set([...parsed, ...PRESET_FONTS]));
      } catch (e) {
        console.error("Failed to parse saved fonts", e);
      }
    }
    return PRESET_FONTS;
  });

  // 2. Helper to save to local storage
  const saveFontsToStorage = (newList: string[]) => {
    // Only save fonts that aren't in the default PRESET_FONTS list
    const customOnly = newList.filter((f) => !PRESET_FONTS.includes(f));
    localStorage.setItem("tgs_custom_fonts", JSON.stringify(customOnly));
  };

  function addFont() {
    const f = customFont.trim();
    if (!f || fontList.includes(f)) return;
    
    const newList = [f, ...fontList];
    setFontList(newList);
    saveFontsToStorage(newList); // Save to storage
    
    onUpdate({ fontFamily: f });
    setCustomFont("");
  }

  function handleFontUpload() {
    if (!window.cloudinary) {
      alert("Cloudinary widget is still loading. Please try again in a moment.");
      return;
    }
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY; 
    const uploadPreset = "font_upload_preset";

    if (!cloudName || !apiKey) {
      alert("Missing Cloudinary Cloud Name or API Key environment variables.");
      return;
    }

    const generateSignatureCallback = async (
      callback: (signature: string) => void,
      paramsToSign: Record<string, unknown>
    ) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/cloudinary/sign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-config-secret": import.meta.env.VITE_CONFIG_SECRET || "", 
          },
          body: JSON.stringify({ paramsToSign }),
        });
        const data = await response.json();
        
        if (data.signature) {
          callback(data.signature);
        } else {
          console.error("No signature returned");
        }
      } catch (error) {
        console.error("Signature generation failed:", error);
      }
    };

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        apiKey: apiKey,
        uploadPreset: uploadPreset,
        uploadSignature: generateSignatureCallback, 
        sources: ["local", "url"],
        multiple: false,
        resourceType: "raw", 
        clientAllowedFormats:["ttf", "otf", "woff2"],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          let publicId = result.info.public_id;
          
          const format = (result.info.format || result.info.original_extension || "ttf").toLowerCase();
          if (!publicId.toLowerCase().endsWith(`.${format}`)) {
            publicId += `.${format}`;
          }

          const cloudinaryFontName = publicId.replace(/\//g, ":");
          
          if (!fontList.includes(cloudinaryFontName)) {
            setFontList((prev) => {
              const newList = [cloudinaryFontName, ...prev];
              saveFontsToStorage(newList); // Save to storage
              return newList;
            });
          }
          onUpdate({ fontFamily: cloudinaryFontName });
        }
      }
    );
    widget.open();
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
          
          {/* Cloudinary Font Upload Button */}
          <div style={{ marginTop: "6px" }}>
            <button 
              type="button" 
              onClick={handleFontUpload}
              style={{
                padding: "6px 12px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                width: "100%",
                color: "var(--text)"
              }}
            >
              Upload Custom Font (.ttf / .otf)
            </button>
            <p style={{ fontSize: "10px", color: "var(--text2)", marginTop: "4px", lineHeight: "1.3" }}>
              * File name <b>must not</b> contain underscores.<br/>
              * Valid formats: .ttf, .otf, .woff2
            </p>
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
          fontFamily: field.fontFamily.includes(".ttf") || field.fontFamily.includes(".otf") ? "sans-serif" : field.fontFamily,
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

/* ── Image field configuration editor ──────────────────────── */
function ImageFieldConfigEditor({
  field,
  onUpdate,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: any; // Using any here temporarily to support the new dynamic properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (patch: any) => void;
}) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  // const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY; 
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default"; 

  function handleUpload(isMask: boolean = false) {
    if (!window.cloudinary) return alert("Cloudinary widget is still loading.");

    // Determine the aspect ratio from the field's settings.
    // The format needs to be a number (e.g., 4/3 = 1.333).
    let croppingAspectRatio = null;
    if (field.aspectRatio && field.aspectRatio !== "auto") {
      const parts = field.aspectRatio.split(":");
      if (parts.length === 2) {
        croppingAspectRatio = parseFloat(parts[0]) / parseFloat(parts[1]);
      }
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        sources: ["local", "url", "camera"],
        multiple: false,
        clientAllowedFormats: ["png", "jpeg", "jpg", "webp"],
        // --- CROPPING CONFIGURATION ---
        cropping: !isMask, // Enable cropping only for the main image, not masks
        croppingAspectRatio: croppingAspectRatio, // Enforce the ratio
        croppingShowDimensions: true,
        croppingValidateDimensions: true,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          const publicId = result.info.public_id;

          if (isMask) {
            onUpdate({ maskPublicId: publicId });
          } else {
            // If the user cropped, the coordinates will be in the result!
            const cropData = result.info.coordinates?.custom?.[0];
            const cropCoordinates = cropData
              ? {
                  x: cropData[0],
                  y: cropData[1],
                  width: cropData[2],
                  height: cropData[3],
                }
              : undefined;

            onUpdate({
              samplePublicId: publicId,
              cropCoordinates: cropCoordinates,
            });
          }
        }
      },
    );
    widget.open();
  }

  return (
    <div className="fb-style">
      <p className="fb-sub-label">Image Configuration</p>

      {/* Uploads */}
      <div className="fb-style-grid">
        <div className="fb-group fb-group--wide">
          <label>Test Image (For Preview)</label>
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => handleUpload(false)}
              className="fb-chip"
            >
              {field.samplePublicId ? "Change Test Image" : "Upload Test Image"}
            </button>
            {field.samplePublicId && (
              <span style={{ fontSize: "11px", color: "var(--gold)" }}>
                ✓ Loaded
              </span>
            )}
          </div>
        </div>

        <div className="fb-group fb-group--wide">
          <label>Custom Shape Mask (e.g. Heart/Star)</label>
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => handleUpload(true)}
              className="fb-chip"
            >
              {field.maskPublicId ? "Change Mask" : "Upload Mask (PNG)"}
            </button>
            {field.maskPublicId && (
              <button
                type="button"
                onClick={() => onUpdate({ maskPublicId: null })}
                className="fb-chip"
                style={{ borderColor: "#c0392b", color: "#c0392b" }}
              >
                ✕ Remove
              </button>
            )}
          </div>
          <p
            style={{
              fontSize: "10px",
              color: "var(--text2)",
              marginTop: "4px",
            }}
          >
            * Mask must be a solid opaque shape on a transparent background.
          </p>
        </div>
      </div>

      <div className="fb-divider" />

      {/* Sliders and Selects */}
      <div className="fb-style-grid">
        <div className="fb-group">
          <label>Crop / Aspect Ratio</label>
          <select
            title="aspectRatio"
            value={field.aspectRatio || "auto"}
            onChange={(e) => onUpdate({ aspectRatio: e.target.value })}
          >
            <option value="auto">Auto (No Crop)</option>
            <option value="1:1">1:1 (Square)</option>
            <option value="4:3">4:3 (Landscape)</option>
            <option value="3:4">3:4 (Portrait)</option>
            <option value="16:9">16:9 (Wide)</option>
          </select>
        </div>

        <div className="fb-group">
          <label>Shape / Border Radius</label>
          <select
            title="borderRadius"
            value={field.borderRadius || "none"}
            onChange={(e) => onUpdate({ borderRadius: e.target.value })}
          >
            <option value="none">None (Sharp)</option>
            <option value="10">Slightly Rounded</option>
            <option value="30">Very Rounded</option>
            <option value="max">Max (Circle / Oval)</option>
          </select>
        </div>
      </div>
    </div>
  );
}