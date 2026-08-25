import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { updateProductCustomWorkflow } from "../../../../../workflows/update-product-custom"
import { PRODUCT_CUSTOM_MODULE } from "../../../../../modules/productCustom"
import { PostProductCustomSchema } from "./validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const productCustomModule = req.scope.resolve(PRODUCT_CUSTOM_MODULE)

  const records = await productCustomModule.listProductCustoms({
    product_id: id,
  })

  const custom = records?.[0] ?? null

  res.json({
    product_custom: custom
      ? {
          document_url: custom.document_url,
          moq: custom.moq,
        }
      : {
          document_url: null,
          moq: 1,
        },
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<PostProductCustomSchema>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { document_url, moq } = req.validatedBody

  const { result } = await updateProductCustomWorkflow(req.scope).run({
    input: {
      product_id: id,
      document_url,
      moq,
    },
  })

  res.json({
    product_custom: {
      document_url: result.product_custom.document_url,
      moq: result.product_custom.moq,
    },
  })
}
