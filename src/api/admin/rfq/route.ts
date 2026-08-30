import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  
  const limit = Number(req.query.limit) || 20
  const offset = Number(req.query.offset) || 0
  
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
    pagination: {
      take: limit,
      skip: offset,
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
