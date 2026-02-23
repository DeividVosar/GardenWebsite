import { useState, useRef, useEffect, useCallback } from "react";
import ZoomableImage from "./components/ZoomableImage";
import PinLayer from "./components/PinLayer";
import DetailsPanel from "./components/DetailsPanel";
import gardenImg from "./assets/gardenimg.jpg";
import pinImg from "./assets/pin.svg";
import "./App.css";
import { listPins, createPin, patchPin, waterPin, deletePin } from "./api/gardenApi";

/**
 * App
 * - Holds global UI state (view/edit mode, selected pin, details panel)
 * - Loads and stores pins
 * - Converts clicks/drags into pin coordinates (percent-based)
 * - Coordinates ZoomableImage + PinLayer + DetailsPanel
 *
 * Notes:
 * - Pin positions are stored as percentages (0..100) so they remain valid across image sizes.
 * - Zoom/pan transform is tracked in a ref for accurate calculations without re-render lag.
 */

const MAP_ID = 1;

// Default values for newly created pins (easy to change later).
const NEW_PIN_DEFAULTS = {
  name: "New little plant",
  type: "Plantus unidentifiedus",
  wateringIntervalDays: null,
};

function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}

function App() {
  const [mode, setMode] = useState("view");
  const [pins, setPins] = useState([]);
  const [selectedPinId, setSelectedPinId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Used by PinLayer to render pins based on the latest known transform.
  const [transformState, setTransformState] = useState({
    scale: 1,
    pos: { x: 0, y: 0 },
  });

  // Always-up-to-date transform for coordinate math.
  const transformRef = useRef({
    scale: 1,
    pos: { x: 0, y: 0 },
  });

  // Natural image size (needed to map client coords -> percent coords).
  // Stored in a ref.
  const imageSizeRef = useRef({ width: 0, height: 0 });

  const selectedPin = pins.find((p) => p.id === selectedPinId) ?? null;

  const updatePinLocal = useCallback((pinId, patchOrDto) => {
    setPins((prevPins) =>
      prevPins.map((pin) => (pin.id === pinId ? { ...pin, ...patchOrDto } : pin))
    );
  }, []);

  const handleTransformChange = useCallback((transform) => {
    transformRef.current = transform;

    // Keep state in sync for PinLayer rendering, without spam.
    requestAnimationFrame(() => {
      setTransformState(transform);
    });
  }, []);

  const handleImageMeta = useCallback(({ naturalWidth, naturalHeight }) => {
    imageSizeRef.current = { width: naturalWidth, height: naturalHeight };
  }, []);

  const addPinAtClient = useCallback(
    async (clientX, clientY) => {
      const { scale, pos } = transformRef.current;
      const { width, height } = imageSizeRef.current;
      if (!width || !height) return;

      const xPercent = ((clientX - pos.x) / (width * scale)) * 100;
      const yPercent = ((clientY - pos.y) / (height * scale)) * 100;

      const payload = {
        xPercent: clampPercent(xPercent),
        yPercent: clampPercent(yPercent),
        ...NEW_PIN_DEFAULTS,
      };

      try {
        const created = await createPin(MAP_ID, payload);
        setPins((prev) => [...prev, created]);
      } catch (e) {
        console.error("Create pin failed:", e);
      }
    },
    [setPins]
  );

  const handleTopLevelClick = useCallback(
    (e) => {
      // Adds a new pin only in Edit mode + Ctrl pressed
      if (mode === "edit" && e.ctrlKey) {
        addPinAtClient(e.clientX, e.clientY);
      }

      // If details are closed, clicking empty space deselects.
      if (!isDetailsOpen && selectedPinId !== null) {
        setSelectedPinId(null);
      }
    },
    [mode, addPinAtClient, isDetailsOpen, selectedPinId]
  );

  const handleMovePin = useCallback(
    (pinId, { xPercent, yPercent }) => {
      updatePinLocal(pinId, { xPercent, yPercent });
    },
    [updatePinLocal]
  );

  const handleCommitMovePin = useCallback(
    async (pinId, { xPercent, yPercent }) => {
      try {
        const updated = await patchPin(pinId, { xPercent, yPercent });
        updatePinLocal(pinId, updated);
      } catch (e) {
        console.error("Move save failed:", e);
      }
    },
    [updatePinLocal]
  );

  const handleOpenPin = useCallback((pinId) => {
    setSelectedPinId(pinId);
  }, []);

  const handleClosePopup = useCallback(() => {
    setSelectedPinId(null);
  }, []);

  const handleMarkWatered = useCallback(
    async (pinId) => {
      try {
        const updated = await waterPin(pinId);
        updatePinLocal(pinId, updated);
      } catch (e) {
        console.error("Water failed:", e);
      }
    },
    [updatePinLocal]
  );

  const handleOpenDetails = useCallback((pinId) => {
    setSelectedPinId(pinId);
    setIsDetailsOpen(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setIsDetailsOpen(false);
    setSelectedPinId(null);
  }, []);

  const handleUpdatePin = useCallback(
    async (pinId, patch) => {
      try {
        const updated = await patchPin(pinId, patch);
        updatePinLocal(pinId, updated);
      } catch (e) {
        console.error("Update failed:", e);
        throw e; // for later?
      }
    },
    [updatePinLocal]
  );

  const handleDeletePin = useCallback(async (pinId) => {
    try {
      await deletePin(pinId);
      setPins((prev) => prev.filter((p) => p.id !== pinId));
      setIsDetailsOpen(false);
      setSelectedPinId(null);
    } catch (e) {
      console.error("Delete failed:", e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await listPins(MAP_ID);
        if (!cancelled) setPins(data);
      } catch (e) {
        console.error("Failed to load pins:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="garden-container" onClick={handleTopLevelClick}>
      {isDetailsOpen && selectedPin && (
        <DetailsPanel
          pin={selectedPin}
          onClose={handleCloseDetails}
          onUpdatePin={handleUpdatePin}
          onDeletePin={handleDeletePin}
        />
      )}

      <div className="toolbar">
        <button onClick={() => setMode((m) => (m === "view" ? "edit" : "view"))}>
          Mode: {mode === "view" ? "View" : "Edit"}
        </button>

        <span className="toolbar-hint">
          {mode === "edit" ? "Ctrl+Click to add. Drag pins to move." : "Click pins to view."}
        </span>
      </div>

      <ZoomableImage
        imageSrc={gardenImg}
        onTransformChange={handleTransformChange}
        onImageMeta={handleImageMeta}
      />

      <PinLayer
        mode={mode}
        pins={pins}
        transform={transformState}
        imageSize={imageSizeRef.current}
        onMovePin={handleMovePin}
        onCommitMovePin={handleCommitMovePin}
        onOpenPin={handleOpenPin}
        selectedPinId={selectedPinId}
        isDetailsOpen={isDetailsOpen}
        onClosePopup={handleClosePopup}
        onMarkWatered={handleMarkWatered}
        onOpenDetails={handleOpenDetails}
        pinImg={pinImg}
      />
    </div>
  );
}

export default App;
