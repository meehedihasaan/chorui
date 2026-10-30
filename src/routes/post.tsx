import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { MainContainer } from '@components/home/main-container';
import { MainHeader } from '@components/home/main-header';
import { pageHead } from '@components/layout/page-shell';
import { Input } from '@components/input/input';

export const Route = createFileRoute('/post')({
  ssr: false,
  head: () =>
    pageHead('New post', 'Write and share a new post on Chorui.'),
  component: PostPage
});

function PostPage(): JSX.Element {
  const navigate = useNavigate();

  const goHome = (): void => {
    void navigate({ to: '/home' });
  };

  return (
    <ProtectedLayout>
      <MainLayout>
        <MainContainer className='pb-24'>
          <MainHeader useActionButton action={goHome} title='New post' />
          <Input modal keepNav closeModal={goHome} />
        </MainContainer>
      </MainLayout>
    </ProtectedLayout>
  );
}
