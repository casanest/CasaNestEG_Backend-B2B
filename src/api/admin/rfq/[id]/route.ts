import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import { RFQ_MODULE } from '../../../../modules/rfq';
import type RfqModuleService from '../../../../modules/rfq/service';
import type { PatchAdminRfqType } from './validators';

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

  const productIds = items.map((item: any) => item.product_id).filter(Boolean);

  let productVariantMap = new Map<string, { variant_info: string | null; variant_title: string | null; variant_sku: string | null; product_handle: string | null; thumbnail: string | null }>();

  if (productIds.length > 0) {
    const { data: products } = await query.graph({
      entity: 'product',
      fields: [
        'id',
        'handle',
        'thumbnail',
        'images.url',
        'variants.id',
        'variants.title',
        'variants.sku',
        'variants.options.value',
        'variants.options.option.name',
      ],
      filters: { id: productIds },
    });

    for (const product of products as any[]) {
      const variants = product.variants || [];
      let variantInfo: string | null = null;
      let variantTitle: string | null = null;
      let variantSku: string | null = null;

      if (variants.length > 0) {
        const variant = variants[0];
        variantTitle = variant.title || null;
        variantSku = variant.sku || null;
        const optionValues = (variant.options || [])
          .map((opt: any) => opt?.value)
          .filter(Boolean);
        variantInfo = optionValues.length > 0 ? optionValues.join(' / ') : null;
      }

      productVariantMap.set(product.id, {
        variant_info: variantInfo,
        variant_title: variantTitle,
        variant_sku: variantSku,
        product_handle: product.handle || null,
        thumbnail: product.thumbnail || product.images?.[0]?.url || null,
      });
    }
  }

  const itemsWithVariants = items.map((item: any) => {
    const pv = productVariantMap.get(item.product_id);
    return {
      ...item,
      variant_info: pv?.variant_info ?? null,
      variant_title: pv?.variant_title ?? null,
      variant_sku: pv?.variant_sku ?? null,
      product_handle: pv?.product_handle ?? null,
      thumbnail: pv?.thumbnail ?? null,
    };
  });
  
  res.json({ rfq: { ...rfq, items: itemsWithVariants } });
}

export async function PATCH(
  req: AuthenticatedMedusaRequest<PatchAdminRfqType>,
  res: MedusaResponse,
): Promise<void> {
  const { id } = req.params;

  const service: RfqModuleService = req.scope.resolve(RFQ_MODULE);

  const existing = await service.listRfqs({ id });

  if (!existing.length) {
    res.status(404).json({ message: 'RFQ not found' });
    return;
  }

  const rfq = await service.updateRfqs({
    id,
    ...req.validatedBody,
  });

  res.json({ rfq });
}
