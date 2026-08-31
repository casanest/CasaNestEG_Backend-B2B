export const defaultAdminAppointmentFields = [
  'id',
  'customer_name',
  'customer_email',
  'customer_phone',
  'company_name',
  'subject',
  'status',
  'created_at',
  'appointment_date'
];

export const listAppointmentsQueryConfig = {
  isList: true,
  defaults: defaultAdminAppointmentFields,
  defaultLimit: 20
};