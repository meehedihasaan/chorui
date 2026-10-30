import cn from 'clsx';
import logoAsset from '@/assets/chorui-logo.png.asset.json';

type ChoruiLogoProps = {
  className?: string;
};

/** The Chorui bird mark, served from the app's media storage. */
export function ChoruiLogo({ className }: ChoruiLogoProps): JSX.Element {
  return (
    <img
      src={logoAsset.url}
      alt='Chorui'
      draggable={false}
      className={cn('h-6 w-6 object-contain', className)}
    />
  );
}
