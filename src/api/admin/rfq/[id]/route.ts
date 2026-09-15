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

  // Key: variant_id when available, otherwise product_id
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

    // Get prices via raw SQL — per variant_id so each variant gets its own price.
    // This reliably handles sale price lists (price_list.type = 'sale').
    const priceRows = await knex
      .select(
        'product_variant.id as variant_id',
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
      .groupBy('product_variant.id');

    // Key price map by variant_id
    const priceMap = new Map<string, { sale_price: number | null; regular_price: number | null; sale_currency: string | null; regular_currency: string | null }>();
    for (const row of priceRows) {
      priceMap.set(row.variant_id, {
        sale_price: row.sale_price,
        regular_price: row.regular_price,
        sale_currency: row.sale_currency,
        regular_currency: row.regular_currency,
      });
    }

    for (const product of products as any[]) {
      const variants = product.variants || [];

      const productHandle = product.handle || null;
      const thumbnail = product.thumbnail || product.images?.[0]?.url || null;

      // Store an entry for each variant keyed by variant_id, with per-variant pricing
      for (const variant of variants) {
        const optionValues = (variant.options || [])
          .map((opt: any) => opt?.value)
          .filter(Boolean);
        const variantInfo = optionValues.length > 0 ? optionValues.join(' / ') : null;

        // Use SQL-computed price for this specific variant
        const priceInfo = priceMap.get(variant.id);
        let variantPrice: number | null = null;
        let variantCurrency: string | null = null;
        let variantOriginalPrice: number | null = null;
        let variantOriginalCurrency: string | null = null;
        if (priceInfo) {
          if (priceInfo.sale_price != null) {
            variantPrice = priceInfo.sale_price;
            variantCurrency = priceInfo.sale_currency;
            variantOriginalPrice = priceInfo.regular_price;
            variantOriginalCurrency = priceInfo.regular_currency;
          } else if (priceInfo.regular_price != null) {
            variantPrice = priceInfo.regular_price;
            variantCurrency = priceInfo.regular_currency;
          }
        }

        productVariantMap.set(variant.id, {
          variant_info: variantInfo,
          variant_title: variant.title || null,
          variant_sku: variant.sku || null,
          product_handle: productHandle,
          thumbnail,
          variant_price: variantPrice,
          variant_currency: variantCurrency,
          variant_original_price: variantOriginalPrice,
          variant_original_currency: variantOriginalCurrency,
        });
      }

      // Also store a fallback entry keyed by product_id (for items without variant_id)
      if (variants.length > 0) {
        const fallbackVariant = variants[0];
        const fallbackPriceInfo = priceMap.get(fallbackVariant.id);
        let fallbackPrice: number | null = null;
        let fallbackCurrency: string | null = null;
        let fallbackOriginalPrice: number | null = null;
        let fallbackOriginalCurrency: string | null = null;
        if (fallbackPriceInfo) {
          if (fallbackPriceInfo.sale_price != null) {
            fallbackPrice = fallbackPriceInfo.sale_price;
            fallbackCurrency = fallbackPriceInfo.sale_currency;
            fallbackOriginalPrice = fallbackPriceInfo.regular_price;
            fallbackOriginalCurrency = fallbackPriceInfo.regular_currency;
          } else if (fallbackPriceInfo.regular_price != null) {
            fallbackPrice = fallbackPriceInfo.regular_price;
            fallbackCurrency = fallbackPriceInfo.regular_currency;
          }
        }
        const optionValues = (fallbackVariant.options || [])
          .map((opt: any) => opt?.value)
          .filter(Boolean);
        const fallbackVariantInfo = optionValues.length > 0 ? optionValues.join(' / ') : null;
        productVariantMap.set(product.id, {
          variant_info: fallbackVariantInfo,
          variant_title: fallbackVariant.title || null,
          variant_sku: fallbackVariant.sku || null,
          product_handle: productHandle,
          thumbnail,
          variant_price: fallbackPrice,
          variant_currency: fallbackCurrency,
          variant_original_price: fallbackOriginalPrice,
          variant_original_currency: fallbackOriginalCurrency,
        });
      }
    }
  }

  const itemsWithVariants = items.map((item: any) => {
    // Look up by variant_id first, fall back to product_id
    const lookupKey = item.variant_id || item.product_id;
    const pv = productVariantMap.get(lookupKey);
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
