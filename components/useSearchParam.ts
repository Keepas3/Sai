'use client';

import { useEffect, useState } from 'react';

// Reads a single URL query param, client-side only, resolved after mount —
// hydration-safe (identical render on the server and the client's first
// paint, updated via useEffect once window is available). Ported from
// tetris-arena's identical hook — see that copy's own comment for why this
// is deliberately not next/navigation's useSearchParams (Suspense-wrapping
// it on a page with no SEO value from SSR-ing the param just trades a
// no-op bailout for a hydration-mismatch warning).
export function useSearchParam(key: string): string | undefined {
  const [value, setValue] = useState<string | undefined>(undefined);

  useEffect(() => {
    setValue(new URLSearchParams(window.location.search).get(key) ?? undefined);
  }, [key]);

  return value;
}
