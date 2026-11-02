import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@lib/context/auth-context';
import { getAnalytics } from '@lib/analytics.functions';
import { analyticsTotals } from '@lib/analytics';
import { MainLayout } from '@components/layout/main-layout';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainContainer } from '@components/home/main-container';
import { MainHeader } from '@components/home/main-header';
import { Button } from '@components/ui/button';
import { HeroIcon } from '@components/ui/hero-icon';
import { Loading } from '@components/ui/loading';
import Link, { useRouter } from '@lib/router';

export const Route = createFileRoute('/analytics')({ ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({ post: typeof search.post === 'string' ? search.post : undefined }),
  head: () => ({ meta: [{ title: 'Post analytics / Chorui' }, { name: 'description', content: 'Your post views, likes, replies, reposts and bookmarks.' }, { property: 'og:title', content: 'Post analytics / Chorui' }, { property: 'og:description', content: 'Track your posts on Chorui.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: AnalyticsPage });
function AnalyticsPage() {
  return <ProtectedLayout><MainLayout><HomeLayout><AnalyticsContent /></HomeLayout></MainLayout></ProtectedLayout>;
}
function AnalyticsContent() {
  const { user } = useAuth();
  const { post } = Route.useSearch();
  const { back } = useRouter();
  const load = useServerFn(getAnalytics);
  const query = useQuery({ queryKey: ['analytics', user?.id, post], queryFn: () => load({ data: { postId: post } }), enabled: !!user, refetchInterval: 30000 });
  const totals = analyticsTotals(query.data ?? []);
  return <MainContainer><MainHeader title='Post analytics' useActionButton action={back}>
    <Button title='Refresh analytics' aria-label='Refresh analytics' className='ml-auto p-2' onClick={() => query.refetch()}><HeroIcon className='h-5 w-5' iconName='ArrowPathIcon' /></Button>
  </MainHeader>
  {query.isPending ? <Loading /> : query.error ? <div role='alert' className='p-5'>Could not load analytics.<Button className='ml-3 font-bold' onClick={() => query.refetch()}>Retry</Button></div> : <>
    <section className='border-b border-light-border p-5 dark:border-dark-border'>
      <h2 className='mb-4 text-xl font-bold'>{post ? 'Post activity' : 'Your post activity'}</h2>
      <div className='grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3'>{Object.entries(totals).map(([key, value]) => <div key={key}><p className='text-sm capitalize text-light-secondary dark:text-dark-secondary'>{key === 'views' ? 'Unique views' : key}</p><p className='mt-1 text-3xl font-bold'>{value.toLocaleString()}</p></div>)}</div>
      <p className='mt-5 text-sm text-light-secondary dark:text-dark-secondary'>Views recorded from November 2, 2026. Your own views are excluded.</p>
    </section>
    <section className='divide-y divide-light-border dark:divide-dark-border'>{query.data?.length ? query.data.map(item => <div className='p-5' key={item.id}><Link href={`/tweet/${item.id}`}><a className='line-clamp-3 font-medium hover:underline'>{item.text || 'Photo post'}</a></Link><p className='mt-2 text-xs text-light-secondary dark:text-dark-secondary'>{new Date(item.createdAt).toLocaleDateString()}</p><div className='mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm'><span>{item.views} views</span><span>{item.likes} likes</span><span>{item.replies} replies</span><span>{item.reposts} reposts</span><span>{item.bookmarks} bookmarks</span></div></div>) : <p className='p-8 text-center text-light-secondary dark:text-dark-secondary'>No posts yet.</p>}</section>
  </>}
  </MainContainer>;
}