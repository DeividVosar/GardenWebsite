import { useRef, useMemo } from "react";
import "./PinLayer.css";
import { formatLastWatered } from "./DateFormatter";

/**
 * PinLayer
 * - Renders all pins above the image (absolute positioning)
 * - Converts stored percentage coordinates <-> screen coordinates
 * - Handles:
 *   - selecting pins (view mode)
 *   - dragging pins (edit mode)
 *   - showing a small popup (when selected + details panel is closed)
 *
 * Coordinate model:
 * - Pins store xPercent/yPercent (0..100) relative to the original image size.
 * - convert those to screen pixels
 */

const FALLBACK_NAME = "New little plant";
const FALLBACK_TYPE = "Plantus unidentifiedus";

function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}

function formatFrequency(days) {
  if (days == null) return "Unknown";
  if (days === 1) return "Every day";
  return `Every ${days} days`;
}

export default function PinLayer({
  mode,
  pins,
  transform,
  imageSize,
  onMovePin,
  onCommitMovePin,
  onOpenPin,
  selectedPinId,
  isDetailsOpen,
  onClosePopup,
  onMarkWatered,
  onOpenDetails,
  pinImg,
}) {
  const dragRef = useRef({
    draggingPinId: null,
    pointerId: null,
    startClient: null,
    lastPercent: null,
    hasMoved: false,
  });

  const hasImageSize = imageSize?.width > 0 && imageSize?.height > 0;

  const toScreen = (xPercent, yPercent) => {
    const left =
      transform.pos.x + (xPercent / 100) * imageSize.width * transform.scale;
    const top =
      transform.pos.y + (yPercent / 100) * imageSize.height * transform.scale;
    return { left, top };
  };

  const toPercent = (clientX, clientY) => {
    const x =
      ((clientX - transform.pos.x) / (imageSize.width * transform.scale)) * 100;
    const y =
      ((clientY - transform.pos.y) / (imageSize.height * transform.scale)) * 100;

    return {
      xPercent: clampPercent(x),
      yPercent: clampPercent(y),
    };
  };

  // Memo avoids re-creating derived strings on every re-render for every pin.
  const derivedPins = useMemo(() => {
    return pins.map((pin) => ({
      ...pin,
      displayName: pin.name || FALLBACK_NAME,
      displayType: pin.type || FALLBACK_TYPE,
      displayLastWatered: formatLastWatered(pin.lastWatered),
      displayFrequency: formatFrequency(pin.wateringIntervalDays),
    }));
  }, [pins]);

  const startDrag = (e, pinId) => {
    if (mode !== "edit") return;
    if (!hasImageSize) return;

    e.stopPropagation();
    e.preventDefault();

    e.currentTarget.setPointerCapture(e.pointerId);

    dragRef.current.draggingPinId = pinId;
    dragRef.current.pointerId = e.pointerId;
    dragRef.current.startClient = { x: e.clientX, y: e.clientY };
    dragRef.current.lastPercent = null;
    dragRef.current.hasMoved = false;
  };

  const moveDrag = (e) => {
    const { draggingPinId, pointerId, startClient, hasMoved } = dragRef.current;
    if (draggingPinId == null) return;
    if (pointerId !== e.pointerId) return;
    if (!hasImageSize) return;

    e.preventDefault();

    const dx = e.clientX - startClient.x;
    const dy = e.clientY - startClient.y;
    const DRAG_THRESHOLD_PX = 4;

    if (!hasMoved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
      return; // still a click, not a drag
    }

    dragRef.current.hasMoved = true;

    const next = toPercent(e.clientX, e.clientY);
    dragRef.current.lastPercent = next;
    onMovePin?.(draggingPinId, next);
  };

  const endDrag = (e) => {
    const { draggingPinId, pointerId, lastPercent, hasMoved } = dragRef.current;
    if (draggingPinId == null) return;
    if (pointerId !== e.pointerId) return;

    dragRef.current.draggingPinId = null;
    dragRef.current.pointerId = null;
    dragRef.current.startClient = null;
    dragRef.current.lastPercent = null;
    dragRef.current.hasMoved = false;

    if (hasMoved && lastPercent) {
      onCommitMovePin?.(draggingPinId, lastPercent);
    }
  };

  return (
    <div className="pin-layer">
      {derivedPins.map((pin) => {
        if (!hasImageSize) return null;

        const { left, top } = toScreen(pin.xPercent, pin.yPercent);
        const isActive = pin.id === selectedPinId && !isDetailsOpen;

        return (
          <div key={pin.id}>
            <img
              src={pinImg}
              alt="Pin"
              className="pin"
              style={{ left, top }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenPin?.(pin.id);
              }}
              onPointerDown={(e) => startDrag(e, pin.id)}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            />

            {isActive && (
              <div
                className="pin-popup"
                style={{ left, top }}
                role="dialog"
                aria-label="Plant overview"
                onClick={(e) => e.stopPropagation()}
              >
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
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>

                  <div className="pin-popup-line">Name: {pin.displayName}</div>
                  <div className="pin-popup-line">Type: {pin.displayType}</div>
                  <div className="pin-popup-line">
                    Last watered: {pin.displayLastWatered}
                  </div>
                  <div className="pin-popup-line">
                    Frequency: {pin.displayFrequency}
                  </div>

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
