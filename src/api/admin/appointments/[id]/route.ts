import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import { APPOINTMENTS_MODULE } from '../../../../modules/appointments';
import type AppointmentsModuleService from '../../../../modules/appointments/service';
import type { PatchAdminAppointmentType } from './validators';

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { id } = req.params;

  const { data: appointments } = await query.graph({
    entity: 'appointment',
    fields: ['*'],
    filters: { id },
  });

  const appointment = appointments[0];

  if (!appointment) {
    res.status(404).json({ message: 'Appointment not found' });
    return;
  }

  res.json({ appointment });
}

export async function PATCH(
  req: AuthenticatedMedusaRequest<PatchAdminAppointmentType>,
  res: MedusaResponse,
): Promise<void> {
  const { id } = req.params;

  const service: AppointmentsModuleService = req.scope.resolve(APPOINTMENTS_MODULE);

  const existing = await service.listAppointments({ id });

  if (!existing.length) {
    res.status(404).json({ message: 'Appointment not found' });
    return;
  }

  const { appointment_date, ...rest } = req.validatedBody;

  const appointment = await service.updateAppointments({
    id,
    ...rest,
    ...(appointment_date !== undefined
      ? { appointment_date: appointment_date ? new Date(appointment_date) : null }
      : {}),
  });

  res.json({ appointment });
}
