import { useRef, useEffect } from "react";
import "./PinLayer.css";
import { formatLastWatered } from "./DateFormatter";

/**
 * Props:
 * - mode: "view" | "edit"
 * - pins: [{ xPercent, yPercent, img, id? }]
 * - transform: { scale, pos: { x, y } }
 * - imageSize: { width, height }
 * - onMovePin(index, { xPercent, yPercent })
 * - onOpenPin(index)
 */
export default function PinLayer({
  mode,
  pins,
  transform,
  imageSize,
  onMovePin,
  onOpenPin,
  selectedPinId,
  isDetailsOpen,
  onClosePopup,
  onMarkWatered,
  onOpenDetails,
}) {
  const dragState = useRef({
    draggingPinId: null,
    startMouse: { x: 0, y: 0 },
  });

  const toScreen = (xPercent, yPercent) => {
    const left =
      transform.pos.x + (xPercent / 100) * imageSize.width * transform.scale;
    const top =
      transform.pos.y + (yPercent / 100) * imageSize.height * transform.scale;
    return { left, top };
  };

  const toPercent = (clientX, clientY) => {
    const xPercent =
      ((clientX - transform.pos.x) / (imageSize.width * transform.scale)) * 100;
    const yPercent =
      ((clientY - transform.pos.y) / (imageSize.height * transform.scale)) * 100;
    // clamp to [0..100] to keep pins on the image
    return {
      xPercent: Math.max(0, Math.min(100, xPercent)),
      yPercent: Math.max(0, Math.min(100, yPercent)),
    };
  };

  const handlePinMouseDown = (e, pinId) => {
    if (mode !== "edit") return;
    e.stopPropagation();
    e.preventDefault(); // don't let ZoomableImage start a drag
    dragState.current.draggingPinId = pinId;
    dragState.current.startMouse = { x: e.clientX, y: e.clientY };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { once: true });
  };

  const handleMouseMove = (e) => {
    const pinId = dragState.current.draggingPinId;
    if (pinId == null) return;
    const { xPercent, yPercent } = toPercent(e.clientX, e.clientY);
    onMovePin?.(pinId, { xPercent, yPercent });
  };

  const handleMouseUp = () => {
    dragState.current.draggingPinId = null;
    window.removeEventListener("mousemove", handleMouseMove);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="pin-layer">
      {pins.map((pin, i) => {
        const { left, top } = toScreen(pin.xPercent, pin.yPercent);
        const isActive = pin.id === selectedPinId && !isDetailsOpen;

        const displayName = pin.name || "New little plant";
        const displayType = pin.type || "Plantus unidentifiedus";

        // Last watered
        const displayLastWatered = formatLastWatered(pin.lastWatered);

        // Frequency
        let displayFrequency;
        if (pin.wateringIntervalDays == null) {
          displayFrequency = "Unknown";
        } else if (pin.wateringIntervalDays === 1) {
          displayFrequency = "Every day";
        } else {
          displayFrequency = `Every ${pin.wateringIntervalDays} days`;
        }

        return (
          <div key={pin.id ?? i}>
            <img
              src={pin.img}
              alt="Pin"
              className="pin"
              style={{ left, top }}
              onMouseDown={(e) => handlePinMouseDown(e, pin.id)}
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenPin) onOpenPin(pin.id);
              }}
            />

            {isActive && (
              <div
                className="pin-popup"
                style={{ left, top }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {/* TEMPORARY!!!!!!!! ADD ACTUAL USE */}
                <div className="pin-popup-inner">
                  <div className="pin-popup-header">
                    <div className="pin-popup-title">Plant overview</div>
                    <button
                      className="pin-popup-close"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClosePopup?.();
                      }}
                    >
                      X
                    </button>
                  </div>
                    <div className="pin-popup-line">Name: {displayName}</div>
                    <div className="pin-popup-line">Type: {displayType}</div>
                    <div className="pin-popup-line">Last watered: {displayLastWatered}</div>
                    <div className="pin-popup-line">Frequency: {displayFrequency}</div>

                    <div className="pin-popup-actions">
                      <button
                        type="button"
                        className="pin-popup-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkWatered?.(pin.id);
                        }}
                        >
                          Mark as watered 
                        </button>
                        <button
                          type="button"
                          className="pin-popup-btn pin-popup-btn-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetails?.(pin.id);
                          }}
                        >
                          More details
                        </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
