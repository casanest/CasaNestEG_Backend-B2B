import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type Input = {
  items: { product_id: string; quantity: number }[]
}

export const resolveProductTitlesStep = createStep(
  "resolve-product-titles-step",
  async (input: Input, { container }) => {
    if (!input.items || input.items.length === 0) {
      return new StepResponse([])
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    
    const productIds = input.items.map((item) => item.product_id)
    
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title"],
      filters: { id: productIds },
    })
    
    const productMap = new Map(products.map((p) => [p.id, p.title]))
    
    const itemsWithTitles = input.items.map((item) => {
      const title = productMap.get(item.product_id)
      if (!title) {
        throw new Error(`Product with id ${item.product_id} not found`)
      }
      return {
        ...item,
        product_title: title,
      }
    })
    
    return new StepResponse(itemsWithTitles)
  }
)
