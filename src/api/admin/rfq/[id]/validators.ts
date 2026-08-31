import { z } from 'zod';

export const PatchAdminRfq = z.object({
  status: z.enum(['pending', 'quoted', 'closed', 'done']).optional(),
});

export type PatchAdminRfqType = z.infer<typeof PatchAdminRfq>;
