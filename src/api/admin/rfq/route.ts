import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import { RFQ_MODULE } from '../../../modules/rfq';
import type RfqModuleService from '../../../modules/rfq/service';
import type {
  DeleteAdminRfqsBodyType,
  GetAdminRfqsParamsType,
} from './validators';

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { limit, offset, status, from, to, sort_by, sort_order } =
    req.validatedQuery as unknown as GetAdminRfqsParamsType;

  const filters: Record<string, unknown> = {};

  if (status) {
    filters.status = status;
  }

  if (from || to) {
    filters.created_at = {
      ...(from ? { $gte: from } : {}),
      ...(to ? { $lte: to } : {}),
    };
  }

  const { data: rfqs, metadata } = await query.graph({
    entity: 'rfq',
    fields: [
      'id',
      'customer_name',
      'company_name',
      'customer_email',
      'city',
      'address',
      'status',
      'created_at',
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
  
  const rfqIds = rfqs.map((rfq: any) => rfq.id)
  
  const { data: items } = await query.graph({
    entity: 'rfq_item',
    fields: ['id', 'rfq_id'],
    filters: { rfq_id: rfqIds },
  });
  
  const itemCountMap = new Map()
  items.forEach((item: any) => {
    const count = itemCountMap.get(item.rfq_id) || 0
    itemCountMap.set(item.rfq_id, count + 1)
  })
  
  const rfqsWithCount = rfqs.map((rfq: any) => ({
    ...rfq,
    items_count: itemCountMap.get(rfq.id) || 0,
  }));
  
  res.json({
    rfqs: rfqsWithCount,
    count: metadata?.count || 0,
    limit,
    offset,
  });
}

export async function DELETE(
  req: AuthenticatedMedusaRequest<DeleteAdminRfqsBodyType>,
  res: MedusaResponse,
): Promise<void> {
  const { ids } = req.validatedBody;

  const service: RfqModuleService = req.scope.resolve(RFQ_MODULE);

  // Soft-delete child records too. The R2 objects are kept so a restore
  // stays complete.
  const attachments = await service.listRfqAttachments({ rfq_id: ids });
  if (attachments.length) {
    await service.softDeleteRfqAttachments(
      attachments.map((att) => att.id),
    );
  }

  const items = await service.listRfqItems({ rfq_id: ids });
  if (items.length) {
    await service.softDeleteRfqItems(
      items.map((item) => item.id),
    );
  }

  const comments = await service.listRfqComments({ rfq_id: ids });
  if (comments.length) {
    await service.softDeleteRfqComments(
      comments.map((comment) => comment.id),
    );
  }

  await service.softDeleteRfqs(ids);

  res.json({ ids });
}
