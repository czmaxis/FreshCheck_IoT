import { useState, useRef, useEffect, useCallback, useMemo } from "react";

export function useChartInteractions(zoomRange, setZoomRange, isMobile) {
  // --- Debounced slider: visual update immediate, zoomRange after 1s pause ---
  const [localZoom, setLocalZoom] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    setLocalZoom(zoomRange);
  }, [zoomRange]);

  // --- Animation tracking (no onAnimationStart to avoid render loops) ---
  const [isAnimating, setIsAnimating] = useState(false);
  const animCountRef = useRef(0);

  const handleSliderChange = useCallback((_, value) => {
    if (!Array.isArray(value) || value.length !== 2) return;
    const start = Math.min(value[0], value[1]);
    const end = Math.max(value[0], value[1]);
    setLocalZoom([start, end]);
    setIsPending(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      animCountRef.current = 2; // expecting 2 Line animations
      setIsAnimating(true);
      setZoomRange([start, end]);
      setIsPending(false);
    }, 1000);
  }, [setZoomRange]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleAnimationEnd = useCallback(() => {
    animCountRef.current = Math.max(0, animCountRef.current - 1);
    if (animCountRef.current === 0) {
      setIsAnimating(false);
    }
  }, []);

  // --- Debounced chart hover: block Recharts pointer-events via direct DOM ---
  const tempChartRef = useRef(null);
  const humChartRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const lastPosRef = useRef(null);
  const syntheticRef = useRef(false);
  const processingRef = useRef(false);

  const setHoverBlock = useCallback((blocked) => {
    const value = blocked ? "none" : "";
    [tempChartRef, humChartRef].forEach((ref) => {
      const el = ref.current?.querySelector(".recharts-wrapper");
      if (el) el.style.pointerEvents = value;
    });
  }, []);

  const handleChartMouseMove = useCallback((e) => {
    if (syntheticRef.current) return;
    if (processingRef.current) return;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    setHoverBlock(true);
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      processingRef.current = true;
      setHoverBlock(false);
      requestAnimationFrame(() => {
        if (!lastPosRef.current) {
          processingRef.current = false;
          return;
        }
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
        requestAnimationFrame(() => {
          processingRef.current = false;
        });
      });
    }, 200);
  }, [setHoverBlock]);

  const handleChartMouseLeave = useCallback(() => {
    clearTimeout(hoverTimerRef.current);
    setHoverBlock(false);
    lastPosRef.current = null;
  }, [setHoverBlock]);

  useEffect(() => () => clearTimeout(hoverTimerRef.current), []);

  const chartBoxSx = useMemo(() => ({
    width: "100%",
    height: isMobile ? 260 : 300,
    "& .recharts-wrapper": {
      pointerEvents: isAnimating ? "none" : "auto",
    },
  }), [isMobile, isAnimating]);

  return {
    localZoom,
    isPending,
    isAnimating,
    handleSliderChange,
    handleAnimationEnd,
    tempChartRef,
    humChartRef,
    chartBoxSx,
    handleChartMouseMove,
    handleChartMouseLeave,
  };
}
