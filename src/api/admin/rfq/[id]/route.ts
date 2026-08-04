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
  
  const { id } = req.params;
  
  const { data: rfqs } = await query.graph({
    entity: 'rfq',
    fields: [
      '*',
    ],
    filters: { id },
  });
  
  const rfq = rfqs[0];
  
  if (!rfq) {
    res.status(404).json({ message: 'RFQ not found' });
    return;
  }
  
  const { data: items } = await query.graph({
    entity: 'rfq_item',
    fields: ['*'],
    filters: { rfq_id: id },
  });
  
  res.json({ rfq: { ...rfq, items } });
}
