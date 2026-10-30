import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { MainContainer } from '@components/home/main-container';
import type { ReactNode } from 'react';

export function PageShell({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ProtectedLayout>
      <MainLayout>
        <HomeLayout>
          <MainContainer>{children}</MainContainer>
        </HomeLayout>
      </MainLayout>
    </ProtectedLayout>
  );
}

export function pageHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} / Chorui` },
      { name: 'description', content: description },
      { property: 'og:title', content: `${title} / Chorui` },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' }
    ]
  };
}
