import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PORTFOLIO_MODULE } from "../../../modules/portfolio"
import PortfolioModuleService from "../../../modules/portfolio/service"

type SubParagraphInput = {
  heading_en: string
  heading_ar: string
  text_en: string
  text_ar: string
  image_url?: string | null
  display_order: number
}

type CreateProjectSubParagraphsStepInput = {
  project_id: string
  sub_paragraphs: SubParagraphInput[]
}

export const createProjectSubParagraphsStep = createStep(
  "create-project-sub-paragraphs-step",
  async (input: CreateProjectSubParagraphsStepInput, { container }) => {
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)

    if (!input.sub_paragraphs || input.sub_paragraphs.length === 0) {
      return new StepResponse([], [])
    }

    const records: any = await portfolioModule.createProjectSubParagraphs(
      input.sub_paragraphs.map((s) => ({
        ...s,
        project_id: input.project_id,
      }))
    )

    const ids: string[] = Array.isArray(records) ? records.map((r: any) => r.id) : [records.id]

    return new StepResponse(records, ids)
  },
  async (ids: string[], { container }) => {
    if (!ids || ids.length === 0) return
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)
    await portfolioModule.deleteProjectSubParagraphs(ids)
  }
)
