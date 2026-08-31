import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import type { GetAdminAppointmentsParamsType } from './validators';

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { limit, offset, status, from, to, date_field, sort_by, sort_order } =
    req.validatedQuery as unknown as GetAdminAppointmentsParamsType;

  const filters: Record<string, unknown> = {};

  if (status) {
    filters.status = status;
  }

  if (from || to) {
    filters[date_field] = {
      ...(from ? { $gte: from } : {}),
      ...(to ? { $lte: to } : {}),
    };
  }

  const { data: appointments, metadata } = await query.graph({
    entity: 'appointment',
    fields: [
      'id',
      'customer_name',
      'customer_email',
      'customer_phone',
      'company_name',
      'subject',
      'status',
      'created_at',
      'appointment_date',
    ],
    filters,
    pagination: {
      take: limit,
      skip: offset,
      order: {
        [sort_by]: sort_order,
      },
    },
  });

  res.json({
    appointments,
    count: metadata?.count || 0,
    limit,
    offset,
  });
}
