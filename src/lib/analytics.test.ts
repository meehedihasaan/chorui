import { describe, it, expect } from 'vitest';
import { analyticsTotals } from './analytics';
describe('real post analytics', () => {
  it('counts reactions, comments, reposts and bookmarks as engagements', () => {
    expect(analyticsTotals([{ id: 'post', text: null, createdAt: '', views: 7, likes: 3, replies: 2, reposts: 1, bookmarks: 4 }])).toEqual({ views: 7, likes: 3, replies: 2, reposts: 1, bookmarks: 4, engagements: 10 });
  });
  it('does not invent views before tracking starts', () => {
    expect(analyticsTotals([]).views).toBe(0);
  });
});