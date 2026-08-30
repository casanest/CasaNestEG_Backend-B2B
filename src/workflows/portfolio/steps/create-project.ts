import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PORTFOLIO_MODULE } from "../../../modules/portfolio"
import PortfolioModuleService from "../../../modules/portfolio/service"

type CreateProjectStepInput = {
  category_id: string
  slug: string
  title_en: string
  title_ar: string
  location_en: string
  location_ar: string
  hero_image_url: string
  project_date: Date
  is_in_homepage?: boolean
  quote_en?: string | null
  quote_ar?: string | null
  position_en?: string | null
  position_ar?: string | null
}

export const createProjectStep = createStep(
  "create-project-step",
  async (input: CreateProjectStepInput, { container }) => {
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)

    const project = await portfolioModule.createProjects(input)

    return new StepResponse(project, project.id)
  },
  async (projectId: string, { container }) => {
    if (!projectId) return
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)
    await portfolioModule.deleteProjects(projectId)
  }
)
