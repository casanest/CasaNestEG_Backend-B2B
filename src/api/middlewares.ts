import { defineMiddlewares, validateAndTransformBody } from '@medusajs/framework';
import { storeSearchRoutesMiddlewares } from './store/search/middlewares';
import { PostStoreRfq } from './store/rfq/validators';

export default defineMiddlewares([
  ...storeSearchRoutesMiddlewares,
  {
    matcher: '/store/rfq',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostStoreRfq)],
  },
]);
