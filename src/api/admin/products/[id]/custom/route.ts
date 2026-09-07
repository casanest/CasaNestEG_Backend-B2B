import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { updateProductCustomWorkflow } from "../../../../../workflows/update-product-custom"
import { PRODUCT_CUSTOM_MODULE } from "../../../../../modules/productCustom"
import ProductCustomModuleService from "../../../../../modules/productCustom/service"
import { PostProductCustomSchema } from "./validators"
import { revalidateStorefrontTag } from "../../../../../lib/revalidate-storefront"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const productCustomModule = req.scope.resolve(PRODUCT_CUSTOM_MODULE) as ProductCustomModuleService

  const records = await productCustomModule.listProductCustoms({
    product_id: id,
  })

  const custom = records?.[0] ?? null

  res.json({
    product_custom: custom
      ? {
          document_url: custom.document_url,
          moq: custom.moq,
          is_in_homepage: custom.is_in_homepage,
          show_price: custom.show_price,
        }
      : {
          document_url: null,
          moq: 1,
          is_in_homepage: false,
          show_price: false,
        },
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<PostProductCustomSchema>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { document_url, moq, is_in_homepage, show_price } = req.validatedBody

  const { result } = await updateProductCustomWorkflow(req.scope).run({
    input: {
      product_id: id,
      document_url,
      moq,
      is_in_homepage,
      show_price,
    },
  })

  await revalidateStorefrontTag("products")

  res.json({
    product_custom: {
      document_url: result.product_custom.document_url,
      moq: result.product_custom.moq,
      is_in_homepage: result.product_custom.is_in_homepage,
      show_price: result.product_custom.show_price,
    },
  })
}
