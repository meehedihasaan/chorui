import { useEffect, useState } from 'react';
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
  // read on the client only: the server render has no reliable session/storage and would cache defaults
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const { data } = useQuery({
    queryKey: APP_SETTINGS_KEY,
    enabled: ready,
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
export function AppSettingsApplier(): JSX.Element | null {
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

  if (typeof window !== 'undefined') console.log('APPSET', JSON.stringify(s));
  const c = s.brandColor ? hexToRgbTriplet(s.brandColor) : null;
  const radius = s.buttonStyle === 'rounded' ? '0.75rem' : s.buttonStyle === 'square' ? '0.25rem' : null;
  let css = '';
  if (c) css += `:root, :root.dark, .dark, .dim { --accent-mono: ${c.rgb} !important; --accent-mono-foreground: ${c.fg} !important; }`;
  if (radius) css += `:is(button, a[role='button'], .custom-button).rounded-full { border-radius: ${radius} !important; }`;
  if (!css) return null;
  return <style data-app-settings=''>{css}</style>;
}
