import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ButtonStyle = 'pill' | 'rounded' | 'square';
export type AppSettings = {
  appName: string;
  logoUrl: string | null;
  brandColor: string | null;
  buttonStyle: ButtonStyle;
};

export const DEFAULT_SETTINGS: AppSettings = { appName: 'Chorui', logoUrl: null, brandColor: null, buttonStyle: 'pill' };
export const APP_SETTINGS_KEY = ['app-settings'];

export function useAppSettings(): AppSettings {
  const { data } = useQuery({
    queryKey: APP_SETTINGS_KEY,
    staleTime: 60_000,
    queryFn: async (): Promise<AppSettings> => {
      const { data } = await supabase.from('app_settings').select('*').eq('id', 1).maybeSingle();
      if (!data) return DEFAULT_SETTINGS;
      return {
        appName: data.app_name || 'Chorui',
        logoUrl: data.logo_url,
        brandColor: data.brand_color,
        buttonStyle: (data.button_style as ButtonStyle) ?? 'pill'
      };
    }
  });
  return data ?? DEFAULT_SETTINGS;
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
    const root = document.documentElement;
    root.dataset.buttonStyle = s.buttonStyle;
    const c = s.brandColor ? hexToRgbTriplet(s.brandColor) : null;
    let el = document.getElementById('brand-color-style');
    if (!c) {
      el?.remove();
      return;
    }
    if (!el) {
      el = document.createElement('style');
      el.id = 'brand-color-style';
      document.head.appendChild(el);
    }
    el.textContent = `:root, :root.dark, .dark, .dim, :root.dim { --accent-mono: ${c.rgb} !important; --accent-mono-foreground: ${c.fg} !important; }`;
  }, [s.buttonStyle, s.brandColor]);

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

  return null;
}
