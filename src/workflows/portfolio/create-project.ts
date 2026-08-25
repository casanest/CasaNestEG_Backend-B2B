import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createProjectStep } from "./steps/create-project"
import { createProjectMetricsStep } from "./steps/create-project-metrics"
import { createProjectSubParagraphsStep } from "./steps/create-project-sub-paragraphs"
import { createProjectGalleryImagesStep } from "./steps/create-project-gallery-images"

type MetricInput = {
  label_en: string
  label_ar: string
  value_en: string
  value_ar: string
  display_order: number
}

type SubParagraphInput = {
  heading_en: string
  heading_ar: string
  text_en: string
  text_ar: string
  image_url?: string | null
  display_order: number
}

type GalleryImageInput = {
  image_url: string
  display_order: number
}

type CreateProjectWorkflowInput = {
  category_id: string
  slug: string
  title_en: string
  title_ar: string
  location_en: string
  location_ar: string
  hero_image_url: string
  project_date: Date
  is_in_homepage?: boolean
  metrics?: MetricInput[]
  sub_paragraphs?: SubParagraphInput[]
  gallery_images?: GalleryImageInput[]
}

export const createProjectWorkflow = createWorkflow(
  "create-portfolio-project",
  function (input: CreateProjectWorkflowInput) {
    const project = createProjectStep({
      category_id: input.category_id,
      slug: input.slug,
      title_en: input.title_en,
      title_ar: input.title_ar,
      location_en: input.location_en,
      location_ar: input.location_ar,
      hero_image_url: input.hero_image_url,
      project_date: input.project_date,
      is_in_homepage: input.is_in_homepage,
    })

    const metrics = createProjectMetricsStep({
      project_id: project.id,
      metrics: input.metrics ?? [],
    }).config({ name: "create-project-metrics" })

    const sub_paragraphs = createProjectSubParagraphsStep({
      project_id: project.id,
      sub_paragraphs: input.sub_paragraphs ?? [],
    }).config({ name: "create-project-sub-paragraphs" })

    const gallery_images = createProjectGalleryImagesStep({
      project_id: project.id,
      gallery_images: input.gallery_images ?? [],
    }).config({ name: "create-project-gallery-images" })

    return new WorkflowResponse({
      project,
      metrics,
      sub_paragraphs,
      gallery_images,
    })
  }
)
