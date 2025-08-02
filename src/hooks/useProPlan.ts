import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'followuply_is_pro';

export function useProPlan() {
  const [isPro, setIsPro] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) === true : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(isPro));
    } catch {
      // ignore storage errors
    }
  }, [isPro]);

  const setPro = useCallback((next: boolean) => {
    setIsPro(next);
  }, []);

  return { isPro, setPro };
}
