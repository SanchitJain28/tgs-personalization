import { useRef, useCallback } from "react";
import "./PositionPicker.css";
import { type PersonalizationConfig } from "../config-editor/ConfigEditor";

interface PositionPickerProps {
  config: PersonalizationConfig;
  previewImage: string | null;
  onChange: (patch: Partial<PersonalizationConfig>) => void;
}

export default function PositionPicker({
  config,
  previewImage,
  onChange,
}: PositionPickerProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  const xPercent = config.xPercent ?? 50;
  const yPercent = config.yPercent ?? 80;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      onChange({
        xPercent: Math.round(x),
        yPercent: Math.round(y),
        gravity: "north_west",
      });
    },
    [onChange],
  );

  return (
    <div className="pp">
      {previewImage ? (
        <>
          <p className="pp-hint">
            Click anywhere on the image to place the text.
          </p>
          <div className="pp-image-wrap" onClick={handleClick}>
            <img
              ref={imgRef}
              src={previewImage}
              alt="Product preview"
              className="pp-image"
              draggable={false}
            />

            {/* Marker */}
            <div
              className="pp-marker"
              style={{
                left: `${xPercent}%`,
                top: `${yPercent}%`,
              }}
            >
              <div className="pp-marker-dot" />
              <div className="pp-marker-ring" />
            </div>

            {/* Preview text label at marker position */}
            <div
              className="pp-preview-text"
              style={{
                left: `${xPercent}%`,
                top: `${yPercent}%`,
                color: `#${config.textColor}`,
                fontSize: `${Math.max(10, config.fontSize * 0.18)}px`,
                fontFamily: config.fontFamily,
              }}
            >
              Preview Text
            </div>
          </div>

          <div className="pp-coords">
            <span>
              X: <strong>{xPercent}%</strong>
            </span>
            <span>
              Y: <strong>{yPercent}%</strong>
            </span>
          </div>
        </>
      ) : (
        <div className="pp-no-image">
          <p>No preview image set for this product.</p>
          <p>
            Add a <code>custom.preview_image</code> metafield to enable click
            positioning.
          </p>
        </div>
      )}
    </div>
  );
}
