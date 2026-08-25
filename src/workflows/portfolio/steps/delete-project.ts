import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PORTFOLIO_MODULE } from "../../../modules/portfolio"
import PortfolioModuleService from "../../../modules/portfolio/service"

export const deleteProjectStep = createStep(
  "delete-project-step",
  async (input: { id: string }, { container }) => {
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)

    const project = await portfolioModule.retrieveProject(input.id)
    const metrics = await portfolioModule.listProjectMetrics({ project_id: input.id })
    const subParagraphs = await portfolioModule.listProjectSubParagraphs({ project_id: input.id })
    const galleryImages = await portfolioModule.listProjectGalleryImages({ project_id: input.id })

    await portfolioModule.deleteProjectMetrics(metrics.map((m: any) => m.id))
    await portfolioModule.deleteProjectSubParagraphs(subParagraphs.map((s: any) => s.id))
    await portfolioModule.deleteProjectGalleryImages(galleryImages.map((g: any) => g.id))
    await portfolioModule.deleteProjects(input.id)

    return new StepResponse(input.id, {
      project,
      metrics,
      subParagraphs,
      galleryImages,
    })
  },
  async (compensationData: {
    project: any
    metrics: any[]
    subParagraphs: any[]
    galleryImages: any[]
  }, { container }) => {
    if (!compensationData) return
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)

    const restored = await portfolioModule.createProjects({
      category_id: compensationData.project.category_id,
      slug: compensationData.project.slug,
      title_en: compensationData.project.title_en,
      title_ar: compensationData.project.title_ar,
      location_en: compensationData.project.location_en,
      location_ar: compensationData.project.location_ar,
      hero_image_url: compensationData.project.hero_image_url,
      project_date: compensationData.project.project_date,
      is_in_homepage: compensationData.project.is_in_homepage,
    })

    if (compensationData.metrics.length > 0) {
      await portfolioModule.createProjectMetrics(
        compensationData.metrics.map((m) => ({
          project_id: restored.id,
          label_en: m.label_en,
          label_ar: m.label_ar,
          value_en: m.value_en,
          value_ar: m.value_ar,
          display_order: m.display_order,
        }))
      )
    }

    if (compensationData.subParagraphs.length > 0) {
      await portfolioModule.createProjectSubParagraphs(
        compensationData.subParagraphs.map((s) => ({
          project_id: restored.id,
          heading_en: s.heading_en,
          heading_ar: s.heading_ar,
          text_en: s.text_en,
          text_ar: s.text_ar,
          image_url: s.image_url,
          display_order: s.display_order,
        }))
      )
    }

    if (compensationData.galleryImages.length > 0) {
      await portfolioModule.createProjectGalleryImages(
        compensationData.galleryImages.map((g) => ({
          project_id: restored.id,
          image_url: g.image_url,
          display_order: g.display_order,
        }))
      )
    }
  }
)
