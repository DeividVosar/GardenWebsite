import { useState, useRef } from "react";
import ZoomableImage from "./components/ZoomableImage";
import PinLayer from "./components/PinLayer";
import DetailsPanel from "./components/DetailsPanel";
import gardenImg from "./assets/gardenimg.jpg";
import pinImg from "./assets/pin.svg";
import "./App.css";


function App() {
  const [mode, setMode] = useState("view");
  const [pins, setPins] = useState([]);
  const [selectedPinId, setSelectedPinId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [transformState, setTransformState] = useState({ scale: 1, pos: { x: 0, y: 0 } });
  const transformRef = useRef({ scale: 1, pos: { x: 0, y: 0 } });
  const imageSizeRef = useRef({ width: 0, height: 0 });
  const selectedPin = pins.find((p) => p.id === selectedPinId) ?? null;

  const updatePin = (pinId, patch) => {
    setPins((prevPins) =>
      prevPins.map((pin) =>
        pin.id === pinId ? { ...pin, ...patch } : pin
      )
    );
  };

  const handleTransformChange = (transform) => {
    transformRef.current = transform;

    // Defer the first state sync to the next frame
    requestAnimationFrame(() => {
      setTransformState(transform);
    });

    if (!imageSizeRef.current.width) {
      const img = document.querySelector(".zoomable-img");
      if (img) {
        imageSizeRef.current = {
          width: img.naturalWidth,
          height: img.naturalHeight,
        };
      }
    }
  };

  
const addPinAtClient = (clientX, clientY) => {
  const { scale, pos } = transformRef.current;
  const { width, height } = imageSizeRef.current;

  if (!width || !height) {
    return;
  }

  const xPercent = ((clientX - pos.x) / (width * scale)) * 100;
  const yPercent = ((clientY - pos.y) / (height * scale)) * 100;

    setPins((prev) => [
      ...prev,
      {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${prev.length}`,
        xPercent: Math.max(0, Math.min(100, xPercent)),
        yPercent: Math.max(0, Math.min(100, yPercent)),
        img: pinImg,

        // Plant data (V0.1)
        name: "New little plant",
        type: "Plantus unidentifiedus",
        lastWatered: null,
        wateringIntervalDays: null,
      },
    ]);
  };

  const handleTopLevelClick = (e) => {
    // Add new pin only in Edit mode + Ctrl pressed
    if (mode === "edit" && e.ctrlKey) {
      addPinAtClient(e.clientX, e.clientY);
    }
    if (!isDetailsOpen && selectedPinId !== null) {
      setSelectedPinId(null);
    }
  };

  const handleMovePin = (pinId, { xPercent, yPercent }) => {
    updatePin(pinId, { xPercent, yPercent });
  };

  const handleOpenPin = (pinId) => {
    setSelectedPinId(pinId);
  };

  const handleClosePopup = () => {
    setSelectedPinId(null);
  };

  const handleMarkWatered = (pinId) => {  
    const now = new Date().toISOString();
    updatePin(pinId, { lastWatered: now });
  };
  
  const handleOpenDetails = (pinId) => {
    setSelectedPinId(pinId);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
  setIsDetailsOpen(false);
  setSelectedPinId(null);
  };

  return (
    <div
      className="garden-container"
      style={{ position: "relative" }}
      onClick={handleTopLevelClick}
    >
      {isDetailsOpen && selectedPin && (
        <DetailsPanel
          pin={selectedPin}
          onClose={handleCloseDetails}
          onUpdatePin={updatePin}
        />
      )}
      <div
        style={{
          position: "absolute",
          zIndex: 10,
          left: 12,
          top: 12,
          display: "flex",
          gap: 8,
        }}
      >
        <button
          onClick={() => setMode((m) => (m === "view" ? "edit" : "view"))}
        >
          Mode: {mode === "view" ? "View" : "Edit"}
        </button>
        <span style={{ color: "#ddd" }}>
          {mode === "edit" ? "Ctrl+Click to add. Drag pins to move." : "Click pins to view."}
        </span>
      </div>

      <ZoomableImage
        imageSrc={gardenImg}
        onTransformChange={handleTransformChange}
      />

      <PinLayer
        mode={mode}
        pins={pins}
        transform={transformState}
        imageSize={imageSizeRef.current}
        onMovePin={handleMovePin}
        onOpenPin={handleOpenPin}
        selectedPinId={selectedPinId}
        isDetailsOpen={isDetailsOpen}
        onClosePopup={handleClosePopup}
        onMarkWatered={handleMarkWatered}
        onOpenDetails={handleOpenDetails}
      />
    </div>
  );
}

export default App;
