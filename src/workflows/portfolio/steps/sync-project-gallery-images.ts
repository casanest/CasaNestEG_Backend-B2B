import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PORTFOLIO_MODULE } from "../../../modules/portfolio"
import PortfolioModuleService from "../../../modules/portfolio/service"

type GalleryImageInput = {
  id?: string
  image_url: string
  display_order: number
}

type SyncProjectGalleryImagesStepInput = {
  project_id: string
  gallery_images: GalleryImageInput[]
}

export const syncProjectGalleryImagesStep = createStep(
  "sync-project-gallery-images-step",
  async (input: SyncProjectGalleryImagesStepInput, { container }) => {
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)

    const existing = await portfolioModule.listProjectGalleryImages({
      project_id: input.project_id,
    })

    const existingIds = existing.map((e: any) => e.id)
    const inputIds = input.gallery_images.filter((g) => g.id).map((g) => g.id!)

    const toDelete = existingIds.filter((id: string) => !inputIds.includes(id))

    if (toDelete.length > 0) {
      await portfolioModule.deleteProjectGalleryImages(toDelete)
    }

    const created: any[] = []
    const updated: any[] = []

    for (const img of input.gallery_images) {
      if (img.id) {
        const result = await portfolioModule.updateProjectGalleryImages({
          id: img.id,
          image_url: img.image_url,
          display_order: img.display_order,
        })
        updated.push(result)
      } else {
        const result = await portfolioModule.createProjectGalleryImages({
          project_id: input.project_id,
          image_url: img.image_url,
          display_order: img.display_order,
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

    for (const img of compensationData.existing) {
      await portfolioModule.updateProjectGalleryImages({
        id: img.id,
        image_url: img.image_url,
        display_order: img.display_order,
      })
    }
  }
)
