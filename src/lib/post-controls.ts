import { z } from 'zod';
export const replyPermissions = ['everyone', 'following', 'mentioned', 'nobody'] as const;
export const editPostSchema = z.object({ postId: z.string().uuid(), text: z.string().max(280), hasImages: z.boolean() }).refine(d => d.hasImages || d.text.trim().length > 0, 'Write something or keep a photo.');
export const reportSchema = z.object({ postId: z.string().uuid(), reason: z.enum(['spam', 'harassment', 'hate', 'violence', 'misinformation', 'other']), details: z.string().max(2000) });