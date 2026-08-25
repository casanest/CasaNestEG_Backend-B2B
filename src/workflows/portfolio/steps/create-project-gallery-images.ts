import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PORTFOLIO_MODULE } from "../../../modules/portfolio"
import PortfolioModuleService from "../../../modules/portfolio/service"

type GalleryImageInput = {
  image_url: string
  display_order: number
}

type CreateProjectGalleryImagesStepInput = {
  project_id: string
  gallery_images: GalleryImageInput[]
}

export const createProjectGalleryImagesStep = createStep(
  "create-project-gallery-images-step",
  async (input: CreateProjectGalleryImagesStepInput, { container }) => {
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)

    if (!input.gallery_images || input.gallery_images.length === 0) {
      return new StepResponse([], [])
    }

    const records: any = await portfolioModule.createProjectGalleryImages(
      input.gallery_images.map((g) => ({
        ...g,
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
    await portfolioModule.deleteProjectGalleryImages(ids)
  }
)
