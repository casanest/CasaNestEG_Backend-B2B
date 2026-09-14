import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const productModule = req.scope.resolve(Modules.PRODUCT)

  const allCategories: any[] = []
  let offset = 0
  const pageSize = 200
  let hasMore = true

  while (hasMore) {
    const batch = await productModule.listProductCategories(
      {},
      {
        select: ["id", "name", "parent_category_id", "metadata"],
        take: pageSize,
        skip: offset,
      }
    )
    allCategories.push(...batch)
    offset += batch.length
    hasMore = batch.length === pageSize
  }

  const tree = allCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    parent_category_id: cat.parent_category_id || null,
    en_name: cat.metadata?.localizations?.en?.name || null,
  }))

  res.json({ categories: tree, count: tree.length })
}
