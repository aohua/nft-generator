import { useEffect, useState } from "react";
export function debounce<T extends Function>(fn: T, wait: number) {
  let timer: NodeJS.Timeout | null = null;
  return (...params: any) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      // @ts-ignore: this error
      fn.apply(this, params);
    }, wait);
  };
}

export function useDebounce<T>(value: T, delay: number): T {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(
    () => {
      const handler = setTimeout(() => {
        console.log("triggered debounce");
        setDebouncedValue(value);
      }, delay);
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Only re-call effect if value or delay changes
  );
  return debouncedValue;
}
