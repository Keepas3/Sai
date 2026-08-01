'use client';

import { useCallback, useEffect, useState } from 'react';
import imageUrlBuilder from '@sanity/image-url';
import { client } from '@/sanity/lib/client';

// npm install @sanity/image-url (if you don't already have it)
//
// Expected Sanity document type `backgroundTheme`, editable from the
// dashboard, with these fields:
//   label            — string   (e.g. "Forest")
//   swatchColor      — string   (hex, e.g. "#1f6b3a" — also used as the
//                                fallback color while/if the image doesn't load)
//   backgroundImage  — image
//
// Content editors can add/remove/reorder theme documents in Sanity and the
// picker will pick them up automatically — no code changes needed.

export interface BackgroundTheme {
  id: string;
  label: string;
  swatchColor: string;
  backgroundImage: string; // CSS-ready value: 'none' or url("...")
  backgroundColor: string; // shown behind/instead of the image if it's missing or still loading
}

// Always available, even before Sanity has responded (or if it returns
// nothing) — guarantees the picker is never empty and there's a safe
// fallback to render.
const DEFAULT_THEME: BackgroundTheme = {
  id: 'default',
  label: 'Classic',
  swatchColor: '#1a1a1a',
  backgroundImage: 'none',
  backgroundColor: 'transparent',
};

export const DEFAULT_BACKGROUND_THEME_ID = DEFAULT_THEME.id;

const STORAGE_KEY = 'tetris:background-theme';
// Fired on `window` whenever any component changes the theme, so every other
// mounted component using this hook re-reads storage and updates in step —
// the native `storage` event only fires in *other* tabs, not this one.
const CHANGE_EVENT = 'tetris:background-theme-changed';

const imageBuilder = imageUrlBuilder(client);

const THEMES_QUERY = `*[_type == "backgroundTheme"] | order(_createdAt asc) {
  _id,
  label,
  swatchColor,
  backgroundImage
}`;

interface SanityBackgroundThemeDoc {
  _id: string;
  label?: string;
  swatchColor?: string;
  backgroundImage?: unknown; // Sanity image object
}

function toBackgroundTheme(doc: SanityBackgroundThemeDoc): BackgroundTheme {
  let imageUrl: string | null = null;
  if (doc.backgroundImage) {
    try {
      imageUrl = imageBuilder
        .image(doc.backgroundImage as never)
        .width(1920)
        .quality(80)
        .auto('format')
        .url();
    } catch {
      imageUrl = null;
    }
  }

  const color = doc.swatchColor?.trim() || '#111111';

  return {
    id: doc._id,
    label: doc.label?.trim() || 'Untitled',
    swatchColor: color,
    backgroundImage: imageUrl ? `url("${imageUrl}")` : 'none',
    backgroundColor: color,
  };
}

function readStoredThemeId(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_BACKGROUND_THEME_ID;
  } catch {
    return DEFAULT_BACKGROUND_THEME_ID;
  }
}

export function useBackgroundTheme() {
  const [themes, setThemes] = useState<BackgroundTheme[]>([DEFAULT_THEME]);
  const [isLoading, setIsLoading] = useState(true);
  const [themeId, setThemeIdState] = useState<string>(DEFAULT_BACKGROUND_THEME_ID);

  // Fetch the available themes from Sanity once on mount.
  useEffect(() => {
    let cancelled = false;

    client
      .fetch<SanityBackgroundThemeDoc[]>(THEMES_QUERY)
      .then((docs) => {
        if (cancelled) return;
        const fetched = (docs ?? []).map(toBackgroundTheme);
        setThemes([DEFAULT_THEME, ...fetched]);
      })
      .catch((error) => {
        console.error('Failed to load background themes from Sanity:', error);
        // Fall back to just the built-in Classic theme.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Restore the player's saved choice, and stay in sync with other
  // components using this hook — in this tab (custom event) and others
  // (native storage event).
  useEffect(() => {
    setThemeIdState(readStoredThemeId());

    const handleChange = () => setThemeIdState(readStoredThemeId());
    window.addEventListener(CHANGE_EVENT, handleChange);
    window.addEventListener('storage', handleChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, []);

  const setThemeId = useCallback((id: string) => {
    setThemeIdState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore — selection just won't persist across reloads
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const theme =
    themes.find((candidate) => candidate.id === themeId) ?? themes[0] ?? DEFAULT_THEME;

  return { themeId, theme, themes, setThemeId, isLoading };
}