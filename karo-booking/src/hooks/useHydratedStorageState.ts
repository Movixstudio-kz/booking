"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

export function useHydratedStorageState<T>(initialValue: T, loadValue: () => T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setValue(loadValue()));
    return () => window.cancelAnimationFrame(frameId);
  }, [loadValue]);

  return [value, setValue];
}
