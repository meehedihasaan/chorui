import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ButtonStyle = 'pill' | 'rounded' | 'square';
export type AppSettings = {
  appName: string;
  logoUrl: string | null;
  brandColor: string | null;
  buttonStyle: ButtonStyle;
};

export const DEFAULT_SETTINGS: AppSettings = { appName: 'Chorui', logoUrl: null, brandColor: null, buttonStyle: 'pill' };

let current: AppSettings = DEFAULT_SETTINGS;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

/** Re-reads settings from the backend and updates every subscriber. */
export function refreshAppSettings(): Promise<void> {
  loading = (async () => {
    const { data } = await supabase.from('app_settings').select('*').eq('id', 1).maybeSingle();
    current = data
      ? {
          appName: data.app_name || 'Chorui',
          logoUrl: data.logo_url,
          brandColor: data.brand_color,
          buttonStyle: (data.button_style as ButtonStyle) ?? 'pill'
        }
      : DEFAULT_SETTINGS;
    listeners.forEach((l) => l());
  })();
  return loading;
}

export function useAppSettings(): AppSettings {
  const [s, setS] = useState<AppSettings>(DEFAULT_SETTINGS);
  useEffect(() => {
    const l = () => setS(current);
    listeners.add(l);
    if (!loading) void refreshAppSettings();
    else l();
    return () => void listeners.delete(l);
  }, []);
  return s;
}

/** "#rrggbb" → "r g b" plus a readable text colour for on-accent content. */
export function hexToRgbTriplet(hex: string): { rgb: string; fg: string } | null {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return null;
  const [r, g, b] = m.slice(1).map((v) => parseInt(v, 16));
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return { rgb: `${r} ${g} ${b}`, fg: lum > 0.6 ? '0 0 0' : '255 255 255' };
}

/** Applies admin-chosen brand colour, button style and app name across the app. */
export function AppSettingsApplier(): null {
  const s = useAppSettings();

  useEffect(() => {
    if (s.appName === 'Chorui') return;
    const fix = () => {
      if (document.title.includes('Chorui')) document.title = document.title.replaceAll('Chorui', s.appName);
    };
    fix();
    const obs = new MutationObserver(fix);
    const t = document.querySelector('title');
    if (t) obs.observe(t, { childList: true, characterData: true, subtree: true });
    return () => obs.disconnect();
  }, [s.appName]);

  const c = s.brandColor ? hexToRgbTriplet(s.brandColor) : null;
  const radius = s.buttonStyle === 'rounded' ? '0.75rem' : s.buttonStyle === 'square' ? '0.25rem' : null;
  let css = '';
  if (c) css += `:root, :root.dark, .dark, .dim { --accent-mono: ${c.rgb} !important; --accent-mono-foreground: ${c.fg} !important; }`;
  if (radius) css += `:is(button, a):is(.custom-button, .rounded-full):not(.main-tab) { border-radius: ${radius} !important; }`;
  useEffect(() => {
    let el = document.getElementById('app-settings-style');
    if (!el) {
      el = document.createElement('style');
      el.id = 'app-settings-style';
      document.head.appendChild(el);
    }
    el.textContent = css;
  }, [css]);
  return null;
}
