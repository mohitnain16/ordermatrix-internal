'use client';
import { useCallback, useEffect, useState } from 'react';

export type Mode = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';

const KEY = 'om-theme';

function getSystemMode(): Mode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStoredPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch (_) {}
  return 'system';
}

export function useTheme() {
  const [mode, setMode] = useState<Mode>('light');
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    const stored = readStoredPreference();
    setPreferenceState(stored);
    const attr = document.documentElement.getAttribute('data-mode') as Mode | null;
    if (attr === 'dark' || attr === 'light') setMode(attr);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    function onSystemChange(e: MediaQueryListEvent) {
      if (!localStorage.getItem(KEY)) {
        setMode(e.matches ? 'dark' : 'light');
      }
    }
    mq.addEventListener('change', onSystemChange);
    return () => mq.removeEventListener('change', onSystemChange);
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    if (pref === 'system') {
      try { localStorage.removeItem(KEY); } catch (_) {}
      const system = getSystemMode();
      setMode(system);
      document.documentElement.setAttribute('data-mode', system);
    } else {
      setMode(pref);
      document.documentElement.setAttribute('data-mode', pref);
      try { localStorage.setItem(KEY, pref); } catch (_) {}
    }
  }, []);

  const toggle = useCallback(() => {
    const current: Mode =
      (document.documentElement.getAttribute('data-mode') as Mode | null) ?? getSystemMode();
    const next: Mode = current === 'dark' ? 'light' : 'dark';
    setMode(next);
    setPreferenceState(next);
    document.documentElement.setAttribute('data-mode', next);
    try { localStorage.setItem(KEY, next); } catch (_) {}
  }, []);

  return { mode, preference, toggle, setPreference };
}
