export type PostAnalytics = { id: string; text: string | null; createdAt: string; likes: number; reposts: number; replies: number; views: number; bookmarks: number };
export function analyticsTotals(posts: PostAnalytics[]) {
  return posts.reduce((total, post) => ({
    views: total.views + post.views,
    engagements: total.engagements + post.likes + post.reposts + post.replies + post.bookmarks,
    likes: total.likes + post.likes,
    replies: total.replies + post.replies,
    reposts: total.reposts + post.reposts,
    bookmarks: total.bookmarks + post.bookmarks,
  }), { views: 0, engagements: 0, likes: 0, replies: 0, reposts: 0, bookmarks: 0 });
}