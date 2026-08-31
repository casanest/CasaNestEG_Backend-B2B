import { createFindParams } from '@medusajs/medusa/api/utils/validators';
import { z } from 'zod';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// Bare "YYYY-MM-DD" bounds are parsed as UTC midnight, but the admin picks them
// in its own timezone. `tz_offset` is the browser's Date#getTimezoneOffset()
// (minutes *behind* UTC, so UTC+3 sends -180); shifting by it turns a local-day
// boundary into the correct UTC instant.
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
      // flag date-only input so the refine step knows whether to apply tz_offset
      return Object.assign(date, { isDateOnly: DATE_ONLY.test(value) });
    })
    .refine((date) => !date || !isNaN(date.getTime()), {
      message: 'must be a valid date'
    });

export const GetAdminAppointmentsParams = createFindParams({
  offset: 0,
  limit: 20
})
  .merge(
    z.object({
      date_field: z.enum(['created_at', 'appointment_date']).default('created_at'),
      status: z.enum(['pending', 'contacted', 'scheduled', 'completed', 'cancelled']).optional(),
      // minutes behind UTC, as reported by Date#getTimezoneOffset()
      tz_offset: z.coerce.number().int().min(-840).max(840).default(0),
      from: dateBound(false),
      to: dateBound(true),
      sort_by: z
        .enum(['customer_name', 'created_at', 'status'])
        .default('created_at'),
      sort_order: z.enum(['asc', 'desc']).default('desc'),
    })
  )
  .transform((params) => ({
    ...params,
    from:
      params.from && (params.from as Date & { isDateOnly?: boolean }).isDateOnly
        ? shiftToUtc(params.from, params.tz_offset)
        : params.from,
    to:
      params.to && (params.to as Date & { isDateOnly?: boolean }).isDateOnly
        ? shiftToUtc(params.to, params.tz_offset)
        : params.to
  }))
  .refine((params) => !params.from || !params.to || params.from <= params.to, {
    message: '`from` must be before or equal to `to`',
    path: ['from']
  });

export type GetAdminAppointmentsParamsType = z.infer<typeof GetAdminAppointmentsParams>;
