import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { attachProductsToTitleWorkflow } from "../../../../../workflows/package/attach-products-to-title"
import { detachProductsFromTitleWorkflow } from "../../../../../workflows/package/detach-products-from-title"
import { revalidateStorefrontTag } from "../../../../../lib/revalidate-storefront"
import type { PostAdminAttachProductsSchema } from "../../validators"

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminAttachProductsSchema>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { product_ids } = req.validatedBody

  const { result } = await attachProductsToTitleWorkflow(req.scope).run({
    input: {
      title_id: id,
      product_ids,
    },
  })

  await revalidateStorefrontTag("packages")

  res.json(result)
}

export async function DELETE(
  req: AuthenticatedMedusaRequest<PostAdminAttachProductsSchema>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { product_ids } = req.validatedBody as any

  const { result } = await detachProductsFromTitleWorkflow(req.scope).run({
    input: {
      title_id: id,
      product_ids,
    },
  })

  await revalidateStorefrontTag("packages")

  res.json(result)
}
