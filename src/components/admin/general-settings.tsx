import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import cn from 'clsx';
import { supabase } from '@/integrations/supabase/client';
import logoAsset from '@/assets/chorui-logo.png.asset.json';
import { refreshAppSettings, useAppSettings, type ButtonStyle } from '@lib/app-settings';

const PRESETS = ['#000000', '#1d9bf0', '#00ba7c', '#f91880', '#7856ff', '#ff7a00', '#e0245e'];
const STYLES: { id: ButtonStyle; label: string; radius: string }[] = [
  { id: 'pill', label: 'Pill', radius: '9999px' },
  { id: 'rounded', label: 'Rounded', radius: '0.75rem' },
  { id: 'square', label: 'Square', radius: '0.25rem' }
];
const muted = 'text-light-secondary dark:text-dark-secondary';
const inputCls = 'w-full rounded-md border border-light-line-reply bg-transparent px-3 py-2 outline-none focus:border-main-accent dark:border-dark-line-reply';

export function GeneralSettings(): JSX.Element {
  const current = useAppSettings();
  const [name, setName] = useState(current.appName);
  const [logo, setLogo] = useState<string | null>(current.logoUrl);
  const [color, setColor] = useState<string | null>(current.brandColor);
  const [style, setStyle] = useState<ButtonStyle>(current.buttonStyle);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(current.appName);
    setLogo(current.logoUrl);
    setColor(current.brandColor);
    setStyle(current.buttonStyle);
  }, [current.appName, current.logoUrl, current.brandColor, current.buttonStyle]);

  const pickLogo = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return void toast.error('Choose an image file');
    if (file.size > 2 * 1024 * 1024) return void toast.error('Logo must be under 2 MB');
    const r = new FileReader();
    r.onload = () => setLogo(r.result as string);
    r.readAsDataURL(file);
  };

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.rpc('admin_update_settings', {
      p_app_name: name.trim(),
      p_logo_url: logo as string,
      p_brand_color: color as string,
      p_button_style: style
    });
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success('Settings saved');
    void refreshAppSettings();
  };

  const dirty =
    name.trim() !== current.appName || logo !== current.logoUrl || color !== current.brandColor || style !== current.buttonStyle;
  const radius = STYLES.find((s) => s.id === style)!.radius;

  return (
    <div className='flex flex-col gap-6 p-5'>
      <section className='flex flex-col gap-2'>
        <h3 className='text-lg font-bold'>App name</h3>
        <input className={inputCls} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        <p className={cn('text-sm', muted)}>Shown in the browser tab and as the logo label.</p>
      </section>

      <section className='flex flex-col gap-2'>
        <h3 className='text-lg font-bold'>Logo</h3>
        <div className='flex items-center gap-4'>
          <img src={logo || logoAsset.url} alt='Logo preview' className='h-16 w-16 rounded-xl border border-light-border object-contain p-1 dark:border-dark-border' />
          <label className='cursor-pointer rounded-full border border-light-line-reply px-4 py-1.5 text-sm font-bold dark:border-dark-line-reply'>
            Upload logo
            <input type='file' accept='image/png,image/jpeg,image/webp,image/svg+xml,image/gif' className='hidden' onChange={(e) => pickLogo(e.target.files?.[0])} />
          </label>
          {logo && (
            <button className={cn('text-sm font-bold hover:underline', muted)} onClick={() => setLogo(null)}>
              Use default
            </button>
          )}
        </div>
        <p className={cn('text-sm', muted)}>Square image, max 2 MB.</p>
      </section>

      <section className='flex flex-col gap-2'>
        <h3 className='text-lg font-bold'>Primary colour</h3>
        <div className='flex flex-wrap items-center gap-3'>
          <button
            onClick={() => setColor(null)}
            className={cn('h-9 rounded-full border px-3 text-sm font-bold', !color ? 'border-main-accent ring-2 ring-main-accent' : 'border-light-line-reply dark:border-dark-line-reply')}
          >
            Black &amp; white
          </button>
          {PRESETS.map((c) => (
            <button
              key={c}
              aria-label={`Colour ${c}`}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={cn('h-9 w-9 rounded-full border border-light-border dark:border-dark-border', color === c && 'ring-2 ring-offset-2 ring-offset-main-background ring-light-primary dark:ring-dark-primary')}
            />
          ))}
          <label className='flex items-center gap-2 text-sm font-bold'>
            Custom
            <input type='color' value={color ?? '#000000'} onChange={(e) => setColor(e.target.value)} className='h-9 w-12 cursor-pointer rounded bg-transparent' />
          </label>
        </div>
        <p className={cn('text-sm', muted)}>Used for buttons, active tabs and highlights. People who picked their own colour in Display settings keep it.</p>
      </section>

      <section className='flex flex-col gap-2'>
        <h3 className='text-lg font-bold'>Button style</h3>
        <div className='grid grid-cols-3 gap-3'>
          {STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={cn('flex flex-col items-center gap-3 rounded-xl border p-4', style === s.id ? 'border-main-accent ring-2 ring-main-accent' : 'border-light-border dark:border-dark-border')}
            >
              <span style={{ borderRadius: s.radius, backgroundColor: color ?? undefined }} className={cn('px-5 py-2 text-sm font-bold', color ? 'text-white' : 'bg-main-accent text-main-accent-foreground')}>
                Post
              </span>
              <span className='text-sm font-bold'>{s.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className='flex items-center gap-3 rounded-xl border border-light-border p-4 dark:border-dark-border'>
        <img src={logo || logoAsset.url} alt='' className='h-8 w-8 object-contain' />
        <span className='text-lg font-bold'>{name.trim() || 'App name'}</span>
        <span style={{ borderRadius: radius, backgroundColor: color ?? undefined }} className={cn('ml-auto px-4 py-1.5 text-sm font-bold', color ? 'text-white' : 'bg-main-accent text-main-accent-foreground')}>
          Follow
        </span>
      </section>

      <button
        disabled={!dirty || busy || !name.trim()}
        onClick={save}
        className='rounded-full bg-main-accent py-3 font-bold text-main-accent-foreground disabled:opacity-50'
      >
        {busy ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}
