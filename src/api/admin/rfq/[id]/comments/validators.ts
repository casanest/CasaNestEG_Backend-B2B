import { z } from 'zod';

export const PostAdminRfqComment = z.object({
  body: z.string().min(1),
  author: z.string().optional(),
});

export type PostAdminRfqCommentType = z.infer<typeof PostAdminRfqComment>;
