import { useRouter } from '@lib/router';

type MainLayoutProps = {
  title: string;
  image?: string;
  description?: string;
};

/**
 * Head metadata is managed by TanStack Router's per-route `head()` option;
 * this component stays as a no-op for compatibility with source call sites.
 */
export function SEO({ title, image, description }: MainLayoutProps): null {
  void useRouter;
  void title;
  void image;
  void description;

  return null;
}
