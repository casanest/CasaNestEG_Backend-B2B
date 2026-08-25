import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PORTFOLIO_MODULE } from "../../../modules/portfolio"
import PortfolioModuleService from "../../../modules/portfolio/service"

type CreateCategoryStepInput = {
  slug: string
  name_en: string
  name_ar: string
}

export const createCategoryStep = createStep(
  "create-category-step",
  async (input: CreateCategoryStepInput, { container }) => {
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)

    const category = await portfolioModule.createProjectCategories(input)

    return new StepResponse(category, category.id)
  },
  async (categoryId: string, { container }) => {
    if (!categoryId) return
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)
    await portfolioModule.deleteProjectCategories(categoryId)
  }
)
