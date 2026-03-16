import "./TextStyleEditor.css";
import { type PersonalizationConfig } from "../config-editor/ConfigEditor";

interface TextStyleEditorProps {
  config: PersonalizationConfig;
  onChange: (config: PersonalizationConfig) => void;
}

export default function TextStyleEditor({
  config,
  onChange,
}: TextStyleEditorProps) {
  const fonts = [
    "Cormorant Garamond",
    "Jost",
    "Arial",
    "Playfair Display",
    "Dancing Script",
  ];

  const handleChange = (
    key: keyof PersonalizationConfig,
    value: string | number,
  ) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="tgs-text-style">
      <h3 className="tgs-section-title">Text Styling</h3>

      <div className="tgs-style-grid">
        <div className="tgs-input-group">
          <label>Text Color</label>
          <div className="tgs-color-picker">
            <input
              title="text-color"
              name="text-color"
              type="color"
              value={`#${config.textColor || "C49A3C"}`}
              onChange={(e) =>
                handleChange("textColor", e.target.value.replace("#", ""))
              }
            />
            <span className="tgs-hex-value">
              #{config.textColor || "C49A3C"}
            </span>
          </div>
        </div>

        <div className="tgs-input-group">
          <label>Font Family</label>
          <select
            name="font-family"
            id="font-family"
            title="font-family"
            value={config.fontFamily || "Cormorant Garamond"}
            onChange={(e) => handleChange("fontFamily", e.target.value)}
          >
            {fonts.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>

        <div className="tgs-input-group">
          <label>Font Size</label>
          <input
            name="font-size"
            title="font-size"
            type="number"
            value={config.fontSize || 60}
            onChange={(e) =>
              handleChange("fontSize", parseInt(e.target.value, 10))
            }
            min="10"
            max="200"
          />
        </div>
      </div>
    </div>
  );
}
