import { ChoruiLogo } from '@components/ui/chorui-logo';
import { SEO } from './seo';

export function Placeholder(): JSX.Element {
  return (
    <main className='flex min-h-screen items-center justify-center'>
      <SEO
        title='Chorui'
        description='From breaking news and entertainment to sports and politics, get the full story with all the live commentary.'
        image='/home.png'
      />
      <i>
        <ChoruiLogo className='h-20 w-20' />
      </i>
    </main>
  );
}
