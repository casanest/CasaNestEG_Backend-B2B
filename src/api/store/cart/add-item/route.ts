// @ts-nocheck
import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
// Custom endpoint to add a line item to a cart, bypassing the variant price check.
// This is needed because the core addToCart workflow rejects variants without prices,
// but our cart is a "Quote List" where pricing is confirmed later.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { cart_id, variant_id, quantity } = req.body as {
      cart_id: string
      variant_id: string
      quantity: number
    }

    if (!cart_id || !variant_id) {
      return res.status(400).json({
        message: "cart_id and variant_id are required",
      })
    }

    const qty = quantity || 1

    const cartService = req.scope.resolve("cartModuleService")

    // Fetch existing line items for this cart to check if the variant is already present
    const existingItems = await cartService.listLineItems({
      cart_id,
      variant_id,
    })

    if (existingItems.length > 0) {
      const existingItem = existingItems[0]
      const updatedItem = await cartService.updateLineItems({
        id: existingItem.id,
        quantity: existingItem.quantity + qty,
      })
      return res.json({ line_item: updatedItem })
    }

    // Use the remote query to fetch variant + product details
    const query = req.scope.resolve("query")

    const { data: variants } = await query.graph({
      entity: "product_variant",
      filters: { id: variant_id },
      fields: [
        "id",
        "title",
        "sku",
        "barcode",
        "manage_inventory",
        "product.id",
        "product.title",
        "product.handle",
        "product.thumbnail",
      ],
    })

    if (!variants || variants.length === 0) {
      return res.status(404).json({ message: "Variant not found" })
    }

    const variant = variants[0]
    const product = variant.product || {}

    const lineItem = await cartService.addLineItem({
      cart_id,
      variant_id,
      title: variant.title || product.title || "Product",
      quantity: qty,
      unit_price: 0,
      product_id: product.id,
      product_title: product.title,
      product_handle: product.handle,
      variant_title: variant.title,
      variant_sku: variant.sku,
      variant_barcode: variant.barcode,
      thumbnail: product.thumbnail,
    })

    res.json({ line_item: lineItem })
  } catch (err: any) {
    console.error("[add-item route] Error:", err)
    const status = err.status || err.statusCode || 500
    const message =
      err.message || err.detail || "An error occurred while adding item to cart"
    res.status(status).json({ message })
  }
}
