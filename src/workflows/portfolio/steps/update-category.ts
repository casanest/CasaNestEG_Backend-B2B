import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PORTFOLIO_MODULE } from "../../../modules/portfolio"
import PortfolioModuleService from "../../../modules/portfolio/service"

type UpdateCategoryStepInput = {
  id: string
  slug?: string
  name_en?: string
  name_ar?: string
}

export const updateCategoryStep = createStep(
  "update-category-step",
  async (input: UpdateCategoryStepInput, { container }) => {
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)

    const original = await portfolioModule.retrieveProjectCategory(input.id)

    const updated = await portfolioModule.updateProjectCategories({
      id: input.id,
      slug: input.slug,
      name_en: input.name_en,
      name_ar: input.name_ar,
    })

    return new StepResponse(updated, { id: input.id, original })
  },
  async (compensationData: { id: string; original: any }, { container }) => {
    if (!compensationData) return
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)
    await portfolioModule.updateProjectCategories({
      id: compensationData.id,
      slug: compensationData.original.slug,
      name_en: compensationData.original.name_en,
      name_ar: compensationData.original.name_ar,
    })
  }
)
