import { useEffect, useRef, useState } from "react";
import "./ZoomableImage.css";

/**
 * ZoomableImage
 * - Displays an image that can be panned (drag) and zoomed (wheel).
 * - Reports the current transform (scale + position) to the parent.
 *
 * Coordinate system:
 * - `pos` is the top-left corner of the image in container pixels.
 * - `scale` is applied from transformOrigin: "top left".
 *
 * Props:
 * - imageSrc (string): image URL/import.
 * - onTransformChange ({ scale, pos }): called whenever scale/pos changes.
 * - onImageMeta ({ naturalWidth, naturalHeight }): called once image is loaded.
 */
export default function ZoomableImage({ imageSrc, onTransformChange, onImageMeta }) {
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Drag state lives in refs to avoid re-render spam while dragging.
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Smooth zoom state
  const targetScaleRef = useRef(1);
  const animationFrameRef = useRef(null);
  const lastWheelRef = useRef({ x: 0, y: 0, relX: 0, relY: 0 });

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const getContainerSize = () => {
    const el = containerRef.current;
    if (!el) return { width: window.innerWidth, height: window.innerHeight };
    return { width: el.clientWidth, height: el.clientHeight };
  };

  const getBoundsFor = (imgNaturalW, imgNaturalH, nextScale) => {
    const { width: cw, height: ch } = getContainerSize();
    const scaledW = imgNaturalW * nextScale;
    const scaledH = imgNaturalH * nextScale;

    // If image is smallr than container, minX/minY becomes 0 to keep it inside.
    const minX = Math.min(0, cw - scaledW);
    const minY = Math.min(0, ch - scaledH);

    return { minX, minY };
  };

  const calculateMinScale = (img) => {
    const { width: cw, height: ch } = getContainerSize();
    const scaleX = cw / img.naturalWidth;
    const scaleY = ch / img.naturalHeight;
    return Math.max(scaleX, scaleY); // cover container
  };

  const centerImage = (img, baseScale) => {
    const { width: cw, height: ch } = getContainerSize();
    const scaledW = img.naturalWidth * baseScale;
    const scaledH = img.naturalHeight * baseScale;

    const offsetX = (cw - scaledW) / 2;
    const offsetY = (ch - scaledH) / 2;

    return { x: offsetX, y: offsetY };
  };

  const applyTransform = (nextScale, nextPos) => {
    setScale(nextScale);
    setPos(nextPos);
    onTransformChange?.({ scale: nextScale, pos: nextPos });
  };

  const handleImageLoad = () => {
    const img = imgRef.current;
    if (!img) return;

    onImageMeta?.({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });

    const baseScale = calculateMinScale(img);
    setMinScale(baseScale);
    targetScaleRef.current = baseScale;

    const centeredPos = centerImage(img, baseScale);
    applyTransform(baseScale, centeredPos);
  };

  const stopDragging = () => {
    isDraggingRef.current = false;
  };

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;

    const img = imgRef.current;
    if (!img) return;

    const { minX, minY } = getBoundsFor(img.naturalWidth, img.naturalHeight, scale);

    const newX = clamp(e.clientX - dragStartRef.current.x, minX, 0);
    const newY = clamp(e.clientY - dragStartRef.current.y, minY, 0);

    const nextPos = { x: newX, y: newY };
    setPos(nextPos);
    onTransformChange?.({ scale, pos: nextPos });
  };

  const handleWheel = (e) => {
    e.preventDefault();

    const img = imgRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    lastWheelRef.current = { x: e.clientX, y: e.clientY, relX, relY };

    const zoomIntensity = 0.0015;
    const nextTarget = clamp(
      targetScaleRef.current - e.deltaY * zoomIntensity,
      minScale,
      minScale * 5
    );

    targetScaleRef.current = nextTarget;

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(smoothZoomStep);
  };

  const smoothZoomStep = () => {
    const img = imgRef.current;
    if (!img) return;

    setScale((prevScale) => {
      const diff = targetScaleRef.current - prevScale;
      if (Math.abs(diff) < 0.001) {
        // snap to target
        const snapped = targetScaleRef.current;
        const nextPos = computeZoomedPos(img, snapped);
        setPos(nextPos);
        onTransformChange?.({ scale: snapped, pos: nextPos });
        return snapped;
      }

      const nextScale = clamp(prevScale + diff * 0.25, minScale, minScale * 5);
      const nextPos = computeZoomedPos(img, nextScale);

      setPos(nextPos);
      onTransformChange?.({ scale: nextScale, pos: nextPos });

      animationFrameRef.current = requestAnimationFrame(smoothZoomStep);
      return nextScale;
    });
  };

  const computeZoomedPos = (img, nextScale) => {
    const newW = img.naturalWidth * nextScale;
    const newH = img.naturalHeight * nextScale;

    const { x: mouseX, y: mouseY, relX, relY } = lastWheelRef.current;

    // Keep the point under the mouse stable during zoom.
    const rawX = mouseX - relX * newW;
    const rawY = mouseY - relY * newH;

    const { minX, minY } = getBoundsFor(img.naturalWidth, img.naturalHeight, nextScale);

    return {
      x: clamp(rawX, minX, 0),
      y: clamp(rawY, minY, 0),
    };
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });

    const onResize = () => {
      // Recalculate minScale and re-center on resize.
      // Keeps behavior if window size changes.
      handleImageLoad();
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("blur", stopDragging);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("blur", stopDragging);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
    // minScale is used in wheel clamp; when it changes, clamp logic should update.
  }, [minScale]);

  return (
    <div
      ref={containerRef}
      className="zoomable-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={stopDragging}
      style={{ cursor: isDraggingRef.current ? "grabbing" : "grab" }}
    >
      <img
        ref={imgRef}
        src={imageSrc}
        alt="Garden map"
        className="zoomable-img"
        onLoad={handleImageLoad}
        draggable={false}
        style={{
          position: "absolute",
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
