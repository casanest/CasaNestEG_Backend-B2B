import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework';
import { RFQ_MODULE } from '../../../../../modules/rfq';
import type RfqModuleService from '../../../../../modules/rfq/service';
import type { PostAdminRfqCommentType } from './validators';

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  const { id } = req.params;

  const service: RfqModuleService = req.scope.resolve(RFQ_MODULE);

  const comments = await service.listRfqComments(
    { rfq_id: id },
    { order: { created_at: 'ASC' } }
  );

  res.json({ comments });
}

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminRfqCommentType>,
  res: MedusaResponse,
): Promise<void> {
  const { id } = req.params;

  const service: RfqModuleService = req.scope.resolve(RFQ_MODULE);

  const { body, author } = req.validatedBody;

  const comment = await service.createRfqComments({
    rfq_id: id,
    body,
    author: author || 'Admin',
  });

  res.json({ comment });
}
