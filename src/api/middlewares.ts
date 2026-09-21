import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from '@medusajs/framework';
import {
  errorHandler,
  type MedusaRequest,
  type MedusaResponse,
  type MedusaNextFunction,
} from '@medusajs/framework/http';
import { MedusaError } from '@medusajs/framework/utils';
import * as Sentry from '@sentry/node';
import multer from 'multer';
import { storeSearchRoutesMiddlewares } from './store/search/middlewares';
import { PostStoreRfq } from './store/rfq/validators';
import { PostStoreAppointment } from './store/appointments/validators';
import { DeleteAdminAppointmentsBody, GetAdminAppointmentsParams } from './admin/appointments/validators';
import { listAppointmentsQueryConfig } from './admin/appointments/query-config';
import { PatchAdminAppointment } from './admin/appointments/[id]/validators';
import { PostProductCustomSchema } from './admin/products/[id]/custom/validators';
import attachProductCustomFields from './middlewares/attach-product-custom-fields';
import arabicProductSearch from './middlewares/arabic-product-search';
import { PostAdminPortfolioCategorySchema, PostAdminPortfolioCategoryUpdateSchema } from './admin/portfolio/categories/validators';
import { PostAdminPortfolioProjectSchema, PostAdminPortfolioProjectUpdateSchema } from './admin/portfolio/projects/validators';
import { PostAdminPackageSchema, PostAdminPackageUpdateSchema, PostAdminPackageTitleSchema, PostAdminReorderTitlesSchema } from './admin/packages/validators';
import { PostAdminPackageTitleUpdateSchema, PostAdminAttachProductsSchema } from './admin/package-titles/validators';
import { PostAdminTestimonialSchema, PostAdminTestimonialUpdateSchema } from './admin/testimonials/validators';
import { PostAdminBannerSchema, PostAdminBannerUpdateSchema } from './admin/banners/validators';
import { PostAdminSocialMediaSchema, PostAdminSocialMediaUpdateSchema } from './admin/social-media/validators';
import { DeleteAdminRfqsBody, GetAdminRfqsParams } from './admin/rfq/validators';
import { listRfqsQueryConfig } from './admin/rfq/query-config';
import { PatchAdminRfq } from './admin/rfq/[id]/validators';
import { PostAdminRfqComment } from './admin/rfq/[id]/comments/validators';

const upload = multer({
  storage: multer.memoryStorage(),
});

const logRfqStep = (label: string) => (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
  console.log(`[RFQ-MW] ${label} — body keys: ${Object.keys(req.body || {}).join(', ')}, files: ${(req as any).files?.length ?? 0}`)
  next();
};

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

const originalErrorHandler = errorHandler();

export default defineMiddlewares({
  routes: [
  ...storeSearchRoutesMiddlewares,
  {
    matcher: '/store/rfq',
    method: 'POST',
    middlewares: [
      logRfqStep('before multer'),
      upload.array('files'),
      logRfqStep('after multer'),
      parseRfqItems,
      logRfqStep('after parseRfqItems'),
      validateAndTransformBody(PostStoreRfq),
      logRfqStep('after validation'),
    ],
  },
  {
    matcher: '/store/appointments',
    method: 'POST',
    middlewares: [upload.array('files'), validateAndTransformBody(PostStoreAppointment)],
  },
  {
    matcher: '/admin/appointments',
    method: 'GET',
    middlewares: [
      validateAndTransformQuery(GetAdminAppointmentsParams, listAppointmentsQueryConfig),
    ],
  },
  {
    matcher: '/admin/appointments',
    method: 'DELETE',
    middlewares: [validateAndTransformBody(DeleteAdminAppointmentsBody)],
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
    matcher: '/admin/products/batch-import',
    method: 'POST',
    middlewares: [upload.single('file')],
  },
  {
    matcher: '/admin/products',
    method: 'GET',
    middlewares: [attachProductCustomFields, arabicProductSearch],
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
  {
    matcher: '/admin/packages',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostAdminPackageSchema)],
  },
  {
    matcher: '/admin/packages/:id',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostAdminPackageUpdateSchema)],
  },
  {
    matcher: '/admin/packages/:id/titles',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostAdminPackageTitleSchema)],
  },
  {
    matcher: '/admin/packages/:id/titles/reorder',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostAdminReorderTitlesSchema)],
  },
  {
    matcher: '/admin/package-titles/:id',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostAdminPackageTitleUpdateSchema)],
  },
  {
    matcher: '/admin/package-titles/:id/products',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostAdminAttachProductsSchema)],
  },
  {
    matcher: '/admin/package-titles/:id/products',
    method: 'DELETE',
    middlewares: [validateAndTransformBody(PostAdminAttachProductsSchema)],
  },
  {
    matcher: '/admin/testimonials',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostAdminTestimonialSchema)],
  },
  {
    matcher: '/admin/testimonials/:id',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostAdminTestimonialUpdateSchema)],
  },
  {
    matcher: '/admin/banners',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostAdminBannerSchema)],
  },
  {
    matcher: '/admin/banners/:id',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostAdminBannerUpdateSchema)],
  },
  {
    matcher: '/admin/social-media',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostAdminSocialMediaSchema)],
  },
  {
    matcher: '/admin/social-media/:id',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostAdminSocialMediaUpdateSchema)],
  },
  {
    matcher: '/admin/rfq',
    method: 'GET',
    middlewares: [
      validateAndTransformQuery(GetAdminRfqsParams, listRfqsQueryConfig),
    ],
  },
  {
    matcher: '/admin/rfq',
    method: 'DELETE',
    middlewares: [validateAndTransformBody(DeleteAdminRfqsBody)],
  },
  {
    matcher: '/admin/rfq/:id',
    method: 'PATCH',
    middlewares: [validateAndTransformBody(PatchAdminRfq)],
  },
  {
    matcher: '/admin/rfq/:id/comments',
    method: 'POST',
    middlewares: [validateAndTransformBody(PostAdminRfqComment)],
  },
  ],
  errorHandler: (
    error: MedusaError | any,
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    Sentry.captureException(error);
    return originalErrorHandler(error, req, res, next);
  },
});
