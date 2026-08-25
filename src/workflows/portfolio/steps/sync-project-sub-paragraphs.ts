import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PORTFOLIO_MODULE } from "../../../modules/portfolio"
import PortfolioModuleService from "../../../modules/portfolio/service"

type SubParagraphInput = {
  id?: string
  heading_en: string
  heading_ar: string
  text_en: string
  text_ar: string
  image_url?: string | null
  display_order: number
}

type SyncProjectSubParagraphsStepInput = {
  project_id: string
  sub_paragraphs: SubParagraphInput[]
}

export const syncProjectSubParagraphsStep = createStep(
  "sync-project-sub-paragraphs-step",
  async (input: SyncProjectSubParagraphsStepInput, { container }) => {
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)

    const existing = await portfolioModule.listProjectSubParagraphs({
      project_id: input.project_id,
    })

    const existingIds = existing.map((e: any) => e.id)
    const inputIds = input.sub_paragraphs.filter((s) => s.id).map((s) => s.id!)

    const toDelete = existingIds.filter((id: string) => !inputIds.includes(id))

    if (toDelete.length > 0) {
      await portfolioModule.deleteProjectSubParagraphs(toDelete)
    }

    const created: any[] = []
    const updated: any[] = []

    for (const sub of input.sub_paragraphs) {
      if (sub.id) {
        const result = await portfolioModule.updateProjectSubParagraphs({
          id: sub.id,
          heading_en: sub.heading_en,
          heading_ar: sub.heading_ar,
          text_en: sub.text_en,
          text_ar: sub.text_ar,
          image_url: sub.image_url,
          display_order: sub.display_order,
        })
        updated.push(result)
      } else {
        const result = await portfolioModule.createProjectSubParagraphs({
          project_id: input.project_id,
          heading_en: sub.heading_en,
          heading_ar: sub.heading_ar,
          text_en: sub.text_en,
          text_ar: sub.text_ar,
          image_url: sub.image_url ?? null,
          display_order: sub.display_order,
        })
        created.push(result)
      }
    }

    return new StepResponse(
      { created, updated },
      { existing, toDelete }
    )
  },
  async (compensationData: { existing: any[]; toDelete: string[] }, { container }) => {
    if (!compensationData) return
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)

    for (const sub of compensationData.existing) {
      await portfolioModule.updateProjectSubParagraphs({
        id: sub.id,
        heading_en: sub.heading_en,
        heading_ar: sub.heading_ar,
        text_en: sub.text_en,
        text_ar: sub.text_ar,
        image_url: sub.image_url,
        display_order: sub.display_order,
      })
    }
  }
)
