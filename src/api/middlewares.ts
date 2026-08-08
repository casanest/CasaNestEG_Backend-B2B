import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from '@medusajs/framework';
import { storeSearchRoutesMiddlewares } from './store/search/middlewares';
import { PostStoreRfq } from './store/rfq/validators';
import { PostStoreAppointment } from './store/appointments/validators';
import { GetAdminAppointmentsParams } from './admin/appointments/validators';
import { listAppointmentsQueryConfig } from './admin/appointments/query-config';
import { PatchAdminAppointment } from './admin/appointments/[id]/validators';

export default defineMiddlewares([
  ...storeSearchRoutesMiddlewares,
  {
    matcher: '/store/rfq',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostStoreRfq)],
  },
  {
    matcher: '/store/appointments',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostStoreAppointment)],
  },
  {
    matcher: '/admin/appointments',
    method: 'GET',
    middlewares: [
      validateAndTransformQuery(GetAdminAppointmentsParams, listAppointmentsQueryConfig),
    ],
  },
  {
    matcher: '/admin/appointments/:id',
    method: 'PATCH',
    middlewares: [validateAndTransformBody(PatchAdminAppointment)],
  },
]);
