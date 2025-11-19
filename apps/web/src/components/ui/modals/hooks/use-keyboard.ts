'use client';

import { useEffect } from 'react';

export function useKeyboard(
  handler: (event: KeyboardEvent) => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    document.addEventListener('keydown', handler);

    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, deps);
}