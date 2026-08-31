export const defaultAdminRfqFields = [
  'id',
  'customer_name',
  'company_name',
  'customer_email',
  'city',
  'address',
  'status',
  'created_at',
];

export const listRfqsQueryConfig = {
  isList: true,
  defaults: defaultAdminRfqFields,
  defaultLimit: 20,
};
