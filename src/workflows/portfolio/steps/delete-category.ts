import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PORTFOLIO_MODULE } from "../../../modules/portfolio"
import PortfolioModuleService from "../../../modules/portfolio/service"

export const deleteCategoryStep = createStep(
  "delete-category-step",
  async (input: { id: string }, { container }) => {
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)

    const original = await portfolioModule.retrieveProjectCategory(input.id)
    await portfolioModule.deleteProjectCategories(input.id)

    return new StepResponse(input.id, original)
  },
  async (original: any, { container }) => {
    if (!original) return
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)
    await portfolioModule.createProjectCategories({
      slug: original.slug,
      name_en: original.name_en,
      name_ar: original.name_ar,
    })
  }
)
