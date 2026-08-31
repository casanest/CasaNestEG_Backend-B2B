import { createFindParams } from '@medusajs/medusa/api/utils/validators';
import { z } from 'zod';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const shiftToUtc = (date: Date, tzOffsetMinutes: number) =>
  new Date(date.getTime() + tzOffsetMinutes * 60 * 1000);

const dateBound = (endOfDay: boolean) =>
  z
    .string()
    .optional()
    .transform((value) => {
      if (!value) {
        return undefined;
      }
      const date = new Date(value);
      if (endOfDay && DATE_ONLY.test(value)) {
        date.setUTCHours(23, 59, 59, 999);
      }
      return Object.assign(date, { isDateOnly: DATE_ONLY.test(value) });
    })
    .refine((date) => !date || !isNaN(date.getTime()), {
      message: 'must be a valid date',
    });

export const GetAdminRfqsParams = createFindParams({
  offset: 0,
  limit: 20,
}).merge(
  z.object({
    status: z.enum(['pending', 'quoted', 'closed', 'done']).optional(),
    tz_offset: z.coerce.number().int().min(-840).max(840).default(0),
    from: dateBound(false),
    to: dateBound(true),
    sort_by: z
      .enum(['customer_name', 'created_at', 'status'])
      .default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
  })
);

export type GetAdminRfqsParamsType = z.infer<typeof GetAdminRfqsParams>;
