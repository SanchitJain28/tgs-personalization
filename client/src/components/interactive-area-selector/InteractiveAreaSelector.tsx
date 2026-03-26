// client/src/components/interactive-area-selector/InteractiveAreaSelector.tsx

import { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import { Resizable } from "react-resizable";
import { type ImageField } from "../../types";
import "./InteractiveAreaSelector.css";
import "react-resizable/css/styles.css";

//? Defining the props 
interface Props {
  field: ImageField;
  previewImage: string | null;
  onUpdate: (patch: Partial<ImageField>) => void;
}

export default function InteractiveAreaSelector({
  field,
  previewImage,
  onUpdate,
}: Props) {
  //? Take the Container Ref
  const containerRef = useRef<HTMLDivElement>(null);
  //? Take the draggle Ref
  const draggableRef = useRef<HTMLDivElement>(null);
  //? State for pixel values
  const [pixels, setPixels] = useState({ w: 0, h: 0, x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({
    width: Infinity,
    height: Infinity,
  });

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      const areaX = field.areaX ?? 10;
      const areaY = field.areaY ?? 15;
      const areaWidth = field.areaWidth ?? 80;
      const areaHeight = field.areaHeight ?? 70;

      setContainerSize({ width, height });
      const newPixels = {
        w: (areaWidth / 100) * width,
        h: (areaHeight / 100) * height,
        x: (areaX / 100) * width,
        y: (areaY / 100) * height,
      };
      setPixels(newPixels);
    }
  }, [
    field.areaWidth,
    field.areaHeight,
    field.areaX,
    field.areaY,
    field.rotationAngle,
    previewImage,
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragStop = (_e: any, data: any) => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    onUpdate({
      areaX: (data.x / width) * 100,
      areaY: (data.y / height) * 100,
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDrag = (_e: any, data: any) => {
    console.log("🟢 DRAGGING:", { x: data.x, y: data.y });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleResizeStop = (_e: any, data: any) => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    onUpdate({
      areaWidth: (data.size.width / width) * 100,
      areaHeight: (data.size.height / height) * 100,
    });
  };

  return (
    <div className="fb-pos">
      <p className="fb-sub-label">Photo Area — Drag & Resize Box to Position</p>
      {previewImage ? (
        <>
          <div className="ias-container" ref={containerRef}>
            <img src={previewImage} alt="position preview" draggable={false} />
            <Draggable
              nodeRef={draggableRef}
              bounds="parent"
              position={{ x: pixels.x, y: pixels.y }}
              onDrag={handleDrag}
              onStop={handleDragStop}
            >
              <div
                ref={draggableRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
                onMouseDown={() => console.log("🖱️ MOUSE DOWN on wrapper")}
              >
                <Resizable
                  width={pixels.w}
                  height={pixels.h}
                  onResizeStop={handleResizeStop}
                  minConstraints={[30, 30]}
                  maxConstraints={[containerSize.width, containerSize.height]}
                >
                  <div
                    className="ias-box"
                    style={{
                      width: `${pixels.w}px`,
                      height: `${pixels.h}px`,
                      transform: `rotate(${field.rotationAngle ?? 0}deg)`,
                      transformOrigin: "center center",
                    }}
                    onMouseDown={() => console.log("🖱️ MOUSE DOWN on ias-box")}
                  >
                    <div className="ias-label">{field.label}</div>
                  </div>
                </Resizable>
              </div>
            </Draggable>
          </div>

          <div
            style={{
              marginTop: "12px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <div className="fb-group">
              <label>X Position — {(field.areaX ?? 10).toFixed(1)}%</label>
              <input
                type="range"
                title="X Position"
                min={0}
                max={100}
                step={0.5}
                value={field.areaX ?? 10}
                onChange={(e) => onUpdate({ areaX: Number(e.target.value) })}
              />
            </div>
            <div className="fb-group">
              <label>Y Position — {(field.areaY ?? 15).toFixed(1)}%</label>
              <input
                type="range"
                title="Y Position"
                min={0}
                max={100}
                step={0.5}
                value={field.areaY ?? 15}
                onChange={(e) => onUpdate({ areaY: Number(e.target.value) })}
              />
            </div>
            <div className="fb-group">
              <label>Width — {(field.areaWidth ?? 80).toFixed(1)}%</label>
              <input
                type="range"
                title="Width"
                min={5}
                max={100}
                step={0.5}
                value={field.areaWidth ?? 80}
                onChange={(e) =>
                  onUpdate({ areaWidth: Number(e.target.value) })
                }
              />
            </div>
            <div className="fb-group">
              <label>Height — {(field.areaHeight ?? 70).toFixed(1)}%</label>
              <input
                type="range"
                title="Height"
                min={5}
                max={100}
                step={0.5}
                value={field.areaHeight ?? 70}
                onChange={(e) =>
                  onUpdate({ areaHeight: Number(e.target.value) })
                }
              />
            </div>
            <div className="fb-group" style={{ gridColumn: "1 / -1" }}>
              <label>Rotation — {field.rotationAngle ?? 0}°</label>
              <input
                type="range"
                title="Rotation"
                min={-180}
                max={180}
                step={1}
                value={field.rotationAngle ?? 0}
                onChange={(e) =>
                  onUpdate({ rotationAngle: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </>
      ) : (
        <p className="fb-pos-no-image">
          Set a preview image to define photo area.
        </p>
      )}
    </div>
  );
}
