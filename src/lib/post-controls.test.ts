import { expect, it } from 'vitest';
import { editPostSchema, reportSchema, replyPermissions } from './post-controls';
const postId = '00000000-0000-4000-8000-000000000001';
it('allows editing photo posts without text but rejects empty text-only posts', () => {
  expect(editPostSchema.safeParse({ postId, text: '', hasImages: true }).success).toBe(true);
  expect(editPostSchema.safeParse({ postId, text: '', hasImages: false }).success).toBe(false);
});
it('keeps edits within the existing 280-character post limit', () => {
  expect(editPostSchema.safeParse({ postId, text: 'a'.repeat(280), hasImages: false }).success).toBe(true);
  expect(editPostSchema.safeParse({ postId, text: 'a'.repeat(281), hasImages: false }).success).toBe(false);
});
it('accepts only supported report categories', () => {
  expect(reportSchema.safeParse({ postId, reason: 'spam', details: '' }).success).toBe(true);
  expect(reportSchema.safeParse({ postId, reason: 'fake-category', details: '' }).success).toBe(false);
});
it('offers everyone, following, mentioned, and author-only reply rules', () => {
  expect(replyPermissions).toEqual(['everyone', 'following', 'mentioned', 'nobody']);
});