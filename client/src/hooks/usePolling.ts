import { useEffect, useRef } from "react";

/** Calls `callback` every `intervalMs` milliseconds. Stops when component unmounts. */
export function usePolling(callback: () => void, intervalMs: number = 15000) {
  const savedCb = useRef(callback);
  useEffect(() => { savedCb.current = callback; }, [callback]);

  useEffect(() => {
    const id = setInterval(() => savedCb.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
