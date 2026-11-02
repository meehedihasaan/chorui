import cn from 'clsx';
import logoAsset from '@/assets/chorui-logo.png.asset.json';
import { useAppSettings } from '@lib/app-settings';

type ChoruiLogoProps = {
  className?: string;
};

/** The app mark — the admin-set logo when present, otherwise the Chorui bird. */
export function ChoruiLogo({ className }: ChoruiLogoProps): JSX.Element {
  const { logoUrl, appName } = useAppSettings();
  return (
    <img
      src={logoUrl || logoAsset.url}
      alt={appName}
      draggable={false}
      className={cn('h-6 w-6 object-contain', className)}
    />
  );
}
