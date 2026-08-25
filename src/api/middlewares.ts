import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from '@medusajs/framework';
import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from '@medusajs/framework/http';
import multer from 'multer';
import { storeSearchRoutesMiddlewares } from './store/search/middlewares';
import { PostStoreRfq } from './store/rfq/validators';
import { PostStoreAppointment } from './store/appointments/validators';
import { GetAdminAppointmentsParams } from './admin/appointments/validators';
import { listAppointmentsQueryConfig } from './admin/appointments/query-config';
import { PatchAdminAppointment } from './admin/appointments/[id]/validators';
import { PostProductCustomSchema } from './admin/products/[id]/custom/validators';
import attachProductCustomFields from './middlewares/attach-product-custom-fields';
import { PostAdminPortfolioCategorySchema, PostAdminPortfolioCategoryUpdateSchema } from './admin/portfolio/categories/validators';
import { PostAdminPortfolioProjectSchema, PostAdminPortfolioProjectUpdateSchema } from './admin/portfolio/projects/validators';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per file
});

const parseRfqItems = (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
  const body = req.body as Record<string, unknown> || {};
  if (body.items && typeof body.items === 'string') {
    try {
      body.items = JSON.parse(body.items);
    } catch (e) {
      // Let zod validation catch invalid payloads
    }
  }
  next();
};

export default defineMiddlewares([
  ...storeSearchRoutesMiddlewares,
  {
    matcher: '/store/rfq',
    method: 'POST',
    middlewares: [
      upload.array('files', 10),
      parseRfqItems,
      validateAndTransformBody(PostStoreRfq)
    ],
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
  {
    matcher: '/admin/products/:id/custom',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostProductCustomSchema)],
  },
  {
    matcher: '/admin/products',
    method: 'GET',
    middlewares: [attachProductCustomFields],
  },
  {
    matcher: '/admin/products/:id',
    method: 'GET',
    middlewares: [attachProductCustomFields],
  },
  {
    matcher: '/store/products',
    method: 'GET',
    middlewares: [attachProductCustomFields],
  },
  {
    matcher: '/store/products/:id',
    method: 'GET',
    middlewares: [attachProductCustomFields],
  },
  {
    matcher: '/admin/portfolio/categories',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostAdminPortfolioCategorySchema)],
  },
  {
    matcher: '/admin/portfolio/categories/:id',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostAdminPortfolioCategoryUpdateSchema)],
  },
  {
    matcher: '/admin/portfolio/projects',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostAdminPortfolioProjectSchema)],
  },
  {
    matcher: '/admin/portfolio/projects/:id',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostAdminPortfolioProjectUpdateSchema)],
  },
]);
