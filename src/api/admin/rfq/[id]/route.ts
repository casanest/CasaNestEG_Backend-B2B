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
  const knex = req.scope.resolve('__pg_connection__');
  
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

  let productVariantMap = new Map<string, { variant_info: string | null; variant_title: string | null; variant_sku: string | null; product_handle: string | null; thumbnail: string | null; variant_price: number | null; variant_currency: string | null; variant_original_price: number | null; variant_original_currency: string | null }>();

  if (productIds.length > 0) {
    // Get product/variant display info via query.graph
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

    // Get prices via raw SQL — same approach as store/search route.
    // This reliably handles sale price lists (price_list.type = 'sale')
    // and gets the correct price across all variants instead of variants[0].
    const priceRows = await knex
      .select(
        'product_variant.product_id',
        knex.raw("MIN(CASE WHEN price_list.type = 'sale' THEN price.amount END) AS sale_price"),
        knex.raw('MIN(CASE WHEN price.price_list_id IS NULL THEN price.amount END) AS regular_price'),
        knex.raw("MIN(CASE WHEN price_list.type = 'sale' THEN price.currency_code END) AS sale_currency"),
        knex.raw('MIN(CASE WHEN price.price_list_id IS NULL THEN price.currency_code END) AS regular_currency')
      )
      .from('product_variant')
      .innerJoin('product_variant_price_set', 'product_variant_price_set.variant_id', 'product_variant.id')
      .innerJoin('price_set', 'price_set.id', 'product_variant_price_set.price_set_id')
      .innerJoin('price', 'price.price_set_id', 'price_set.id')
      .leftJoin('price_list', 'price_list.id', 'price.price_list_id')
      .whereIn('product_variant.product_id', productIds)
      .whereNull('product_variant.deleted_at')
      .whereNull('product_variant_price_set.deleted_at')
      .whereNull('price_set.deleted_at')
      .whereNull('price.deleted_at')
      .groupBy('product_variant.product_id');

    const priceMap = new Map<string, { sale_price: number | null; regular_price: number | null; sale_currency: string | null; regular_currency: string | null }>();
    for (const row of priceRows) {
      priceMap.set(row.product_id, {
        sale_price: row.sale_price,
        regular_price: row.regular_price,
        sale_currency: row.sale_currency,
        regular_currency: row.regular_currency,
      });
    }

    for (const product of products as any[]) {
      const variants = product.variants || [];
      let variantInfo: string | null = null;
      let variantTitle: string | null = null;
      let variantSku: string | null = null;
      let variantPrice: number | null = null;
      let variantCurrency: string | null = null;

      if (variants.length > 0) {
        const variant = variants[0];
        variantTitle = variant.title || null;
        variantSku = variant.sku || null;
        const optionValues = (variant.options || [])
          .map((opt: any) => opt?.value)
          .filter(Boolean);
        variantInfo = optionValues.length > 0 ? optionValues.join(' / ') : null;
      }

      // Use SQL-computed price: sale price takes priority over regular price
      const priceInfo = priceMap.get(product.id);
      let variantOriginalPrice: number | null = null;
      let variantOriginalCurrency: string | null = null;
      if (priceInfo) {
        if (priceInfo.sale_price != null) {
          variantPrice = priceInfo.sale_price;
          variantCurrency = priceInfo.sale_currency;
          // Keep regular price as the original (crossed-out) price
          variantOriginalPrice = priceInfo.regular_price;
          variantOriginalCurrency = priceInfo.regular_currency;
        } else if (priceInfo.regular_price != null) {
          variantPrice = priceInfo.regular_price;
          variantCurrency = priceInfo.regular_currency;
        }
      }

      productVariantMap.set(product.id, {
        variant_info: variantInfo,
        variant_title: variantTitle,
        variant_sku: variantSku,
        product_handle: product.handle || null,
        thumbnail: product.thumbnail || product.images?.[0]?.url || null,
        variant_price: variantPrice,
        variant_currency: variantCurrency,
        variant_original_price: variantOriginalPrice,
        variant_original_currency: variantOriginalCurrency,
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
      variant_price: pv?.variant_price ?? null,
      variant_currency: pv?.variant_currency ?? null,
      variant_original_price: pv?.variant_original_price ?? null,
      variant_original_currency: pv?.variant_original_currency ?? null,
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
