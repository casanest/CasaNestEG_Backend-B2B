import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PORTFOLIO_MODULE } from "../../../modules/portfolio"
import PortfolioModuleService from "../../../modules/portfolio/service"

type UpdateProjectStepInput = {
  id: string
  category_id?: string
  slug?: string
  title_en?: string
  title_ar?: string
  location_en?: string
  location_ar?: string
  hero_image_url?: string
  project_date?: Date
  is_in_homepage?: boolean
}

export const updateProjectStep = createStep(
  "update-project-step",
  async (input: UpdateProjectStepInput, { container }) => {
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)

    const original = await portfolioModule.retrieveProject(input.id)

    const updateData: Record<string, any> = { id: input.id }
    if (input.category_id !== undefined) updateData.category_id = input.category_id
    if (input.slug !== undefined) updateData.slug = input.slug
    if (input.title_en !== undefined) updateData.title_en = input.title_en
    if (input.title_ar !== undefined) updateData.title_ar = input.title_ar
    if (input.location_en !== undefined) updateData.location_en = input.location_en
    if (input.location_ar !== undefined) updateData.location_ar = input.location_ar
    if (input.hero_image_url !== undefined) updateData.hero_image_url = input.hero_image_url
    if (input.project_date !== undefined) updateData.project_date = input.project_date
    if (input.is_in_homepage !== undefined) updateData.is_in_homepage = input.is_in_homepage

    const updated = await portfolioModule.updateProjects(updateData)

    return new StepResponse(updated, { id: input.id, original })
  },
  async (compensationData: { id: string; original: any }, { container }) => {
    if (!compensationData) return
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)
    await portfolioModule.updateProjects({
      id: compensationData.id,
      category_id: compensationData.original.category_id,
      slug: compensationData.original.slug,
      title_en: compensationData.original.title_en,
      title_ar: compensationData.original.title_ar,
      location_en: compensationData.original.location_en,
      location_ar: compensationData.original.location_ar,
      hero_image_url: compensationData.original.hero_image_url,
      project_date: compensationData.original.project_date,
      is_in_homepage: compensationData.original.is_in_homepage,
    })
  }
)
