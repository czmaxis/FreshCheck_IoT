import { useState, useRef, useEffect, useCallback, useMemo } from "react";

export function useChartInteractions(zoomRange, setZoomRange, isMobile) {
  // --- Debounced slider: visual update immediate, zoomRange after 1s pause ---
  const [localZoom, setLocalZoom] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    setLocalZoom(zoomRange);
  }, [zoomRange]);

  const handleSliderChange = useCallback((_, value) => {
    if (!Array.isArray(value) || value.length !== 2) return;
    const start = Math.min(value[0], value[1]);
    const end = Math.max(value[0], value[1]);
    setLocalZoom([start, end]);
    setIsPending(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setZoomRange([start, end]);
      setIsPending(false);
    }, 1000);
  }, [setZoomRange]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // --- Debounced chart hover: block Recharts pointer-events via direct DOM ---
  const tempChartRef = useRef(null);
  const humChartRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const lastPosRef = useRef(null);
  const syntheticRef = useRef(false);

  const setHoverBlock = useCallback((blocked) => {
    const value = blocked ? "none" : "";
    [tempChartRef, humChartRef].forEach((ref) => {
      const el = ref.current?.querySelector(".recharts-wrapper");
      if (el) el.style.pointerEvents = value;
    });
  }, []);

  const handleChartMouseMove = useCallback((e) => {
    if (syntheticRef.current) return;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    setHoverBlock(true);
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setHoverBlock(false);
      requestAnimationFrame(() => {
        if (!lastPosRef.current) return;
        syntheticRef.current = true;
        const el = document.elementFromPoint(lastPosRef.current.x, lastPosRef.current.y);
        if (el) {
          el.dispatchEvent(new MouseEvent("mousemove", {
            clientX: lastPosRef.current.x,
            clientY: lastPosRef.current.y,
            bubbles: true,
          }));
        }
        setTimeout(() => { syntheticRef.current = false; }, 0);
      });
    }, 200);
  }, [setHoverBlock]);

  const handleChartMouseLeave = useCallback(() => {
    clearTimeout(hoverTimerRef.current);
    setHoverBlock(false);
    lastPosRef.current = null;
  }, [setHoverBlock]);

  useEffect(() => () => clearTimeout(hoverTimerRef.current), []);

  // contain: layout paint style — isolates chart rendering from page scroll/layout
  const chartBoxSx = useMemo(() => ({
    width: "100%",
    height: isMobile ? 260 : 300,
    contain: "layout paint style",
  }), [isMobile]);

  return {
    localZoom,
    isPending,
    handleSliderChange,
    tempChartRef,
    humChartRef,
    chartBoxSx,
    handleChartMouseMove,
    handleChartMouseLeave,
  };
}
