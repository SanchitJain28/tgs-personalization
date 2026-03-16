import "./PositionPicker.css";
import { type PersonalizationConfig } from "../config-editor/ConfigEditor";

interface PositionPickerProps {
  config: PersonalizationConfig;
  onChange: (config: PersonalizationConfig) => void;
}

export default function PositionPicker({
  config,
  onChange,
}: PositionPickerProps) {
  const gridZones = [
    { id: "north_west", label: "Top Left" },
    { id: "north", label: "Top Center" },
    { id: "north_east", label: "Top Right" },
    { id: "west", label: "Middle Left" },
    { id: "center", label: "Center" },
    { id: "east", label: "Middle Right" },
    { id: "south_west", label: "Bottom Left" },
    { id: "south", label: "Bottom Center" },
    { id: "south_east", label: "Bottom Right" },
  ];

  const currentGravity = config.gravity || "south";

  return (
    <div className="tgs-position-picker">
      <h3 className="tgs-section-title">Text Position</h3>
      <p className="tgs-help-text">
        Click the zone where the text should render on the product image.
      </p>

      <div className="tgs-zone-wrapper">
        <div className="tgs-zone-grid">
          {gridZones.map((zone) => (
            <button
              key={zone.id}
              type="button"
              className={`tgs-zone-btn ${currentGravity === zone.id ? "active" : ""}`}
              onClick={() => onChange({ ...config, gravity: zone.id })}
              title={zone.label}
            >
              <span className="tgs-zone-dot"></span>
            </button>
          ))}
        </div>
        <div className="tgs-active-label">
          Currently mapped to:{" "}
          <strong>
            {gridZones.find((z) => z.id === currentGravity)?.label ||
              "Bottom Center"}
          </strong>
        </div>
      </div>
    </div>
  );
}
