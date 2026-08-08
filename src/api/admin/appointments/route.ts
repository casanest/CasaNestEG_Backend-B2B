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

  const { limit, offset, from, to, date_field } =
    req.validatedQuery as unknown as GetAdminAppointmentsParamsType;

  const filters: Record<string, unknown> = {};

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
      'status',
      'created_at',
      'appointment_date',
    ],
    filters,
    pagination: {
      take: limit,
      skip: offset,
      order: {
        created_at: 'DESC',
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
