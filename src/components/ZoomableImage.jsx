/**
 * 🔒 ZOOM ENGINE v1.0 — DO NOT MODIFY
 * Smooth and precise zoom/pan implementation.
 * Any new behavior must wrap around this file, not edit it.
 */

import { useState, useRef, useEffect } from "react";
import "./ZoomableImage.css";

export default function ZoomableImage({ imageSrc, onTransformChange }) {
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const targetScaleRef = useRef(1);
  const animationFrame = useRef(null);
  const lastWheel = useRef({ x: 0, y: 0, relX: 0, relY: 0 });

  
  const calculateMinScale = (img) => {
    const { naturalWidth, naturalHeight } = img;
    const scaleX = window.innerWidth / naturalWidth;
    const scaleY = window.innerHeight / naturalHeight;
    return Math.max(scaleX, scaleY);
  };

  const handleImageLoad = () => {
    const img = imgRef.current;
    if (!img) return;

    const baseScale = calculateMinScale(img);
    setMinScale(baseScale);
    setScale(baseScale);
    targetScaleRef.current = baseScale;

    const scaledWidth = img.naturalWidth * baseScale;
    const scaledHeight = img.naturalHeight * baseScale;
    const offsetX = (window.innerWidth - scaledWidth) / 2;
    const offsetY = (window.innerHeight - scaledHeight) / 2;
    const newPos = { x: offsetX, y: offsetY };
    setPos(newPos);
    onTransformChange?.({ scale: baseScale, pos: newPos });
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    start.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const img = imgRef.current;
    const scaledWidth = img.naturalWidth * scale;
    const scaledHeight = img.naturalHeight * scale;
    const minX = Math.min(0, window.innerWidth - scaledWidth);
    const minY = Math.min(0, window.innerHeight - scaledHeight);
    const newX = Math.min(0, Math.max(minX, e.clientX - start.current.x));
    const newY = Math.min(0, Math.max(minY, e.clientY - start.current.y));
    const newPos = { x: newX, y: newY };
    setPos(newPos);
    onTransformChange?.({ scale, pos: newPos });
  };

  const handleMouseUp = () => (isDragging.current = false);

  const handleWheel = (e) => {
    e.preventDefault();
    const img = imgRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    lastWheel.current = { x: e.clientX, y: e.clientY, relX, relY };

    const zoomIntensity = 0.0015;
    const newTarget = Math.min(
      minScale * 5,
      Math.max(minScale, targetScaleRef.current - e.deltaY * zoomIntensity)
    );
    targetScaleRef.current = newTarget;

    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    animationFrame.current = requestAnimationFrame(smoothZoom);
  };

  const smoothZoom = () => {
    setScale((prev) => {
      let diff = targetScaleRef.current - prev;
      if (Math.abs(diff) < 0.001) return targetScaleRef.current;

      let next = prev + diff * 0.25;
      if (next < minScale) next = minScale;
      if (next > minScale * 5) next = minScale * 5;

      const img = imgRef.current;
      const newWidth = img.naturalWidth * next;
      const newHeight = img.naturalHeight * next;
      const { x: mouseX, y: mouseY, relX, relY } = lastWheel.current;
      const newX = mouseX - relX * newWidth;
      const newY = mouseY - relY * newHeight;
      const minX = Math.min(0, window.innerWidth - newWidth);
      const minY = Math.min(0, window.innerHeight - newHeight);
      const clampedPos = {
        x: Math.min(0, Math.max(minX, newX)),
        y: Math.min(0, Math.max(minY, newY)),
      };
      setPos(clampedPos);
      onTransformChange?.({ scale: next, pos: clampedPos });
      animationFrame.current = requestAnimationFrame(smoothZoom);
      return next;
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    const onResize = () => handleImageLoad();
    window.addEventListener("resize", onResize);

    return () => {
      if (container) container.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", onResize);
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [minScale]);

  return (
    <div
      ref={containerRef}
      className="zoomable-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ cursor: isDragging.current ? "grabbing" : "grab" }}
    >
      <img
        ref={imgRef}
        src={imageSrc}
        alt="Zoomable"
        className="zoomable-img"
        onLoad={handleImageLoad}
        style={{
          position: "absolute",
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
