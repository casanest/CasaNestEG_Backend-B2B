import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { updateProjectStep } from "./steps/update-project"
import { syncProjectMetricsStep } from "./steps/sync-project-metrics"
import { syncProjectSubParagraphsStep } from "./steps/sync-project-sub-paragraphs"
import { syncProjectGalleryImagesStep } from "./steps/sync-project-gallery-images"

type MetricInput = {
  id?: string
  label_en: string
  label_ar: string
  value_en: string
  value_ar: string
  display_order: number
}

type SubParagraphInput = {
  id?: string
  heading_en: string
  heading_ar: string
  text_en: string
  text_ar: string
  image_url?: string | null
  image_url_2?: string | null
  display_order: number
}

type GalleryImageInput = {
  id?: string
  image_url: string
  display_order: number
}

type UpdateProjectWorkflowInput = {
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
  quote_en?: string | null
  quote_ar?: string | null
  position_en?: string | null
  position_ar?: string | null
  metrics?: MetricInput[]
  sub_paragraphs?: SubParagraphInput[]
  gallery_images?: GalleryImageInput[]
}

export const updateProjectWorkflow = createWorkflow(
  "update-portfolio-project",
  function (input: UpdateProjectWorkflowInput) {
    const project = updateProjectStep({
      id: input.id,
      category_id: input.category_id,
      slug: input.slug,
      title_en: input.title_en,
      title_ar: input.title_ar,
      location_en: input.location_en,
      location_ar: input.location_ar,
      hero_image_url: input.hero_image_url,
      project_date: input.project_date,
      is_in_homepage: input.is_in_homepage,
      quote_en: input.quote_en,
      quote_ar: input.quote_ar,
      position_en: input.position_en,
      position_ar: input.position_ar,
    })

    const metrics = syncProjectMetricsStep({
      project_id: input.id,
      metrics: input.metrics ?? [],
    }).config({ name: "sync-project-metrics" })

    const sub_paragraphs = syncProjectSubParagraphsStep({
      project_id: input.id,
      sub_paragraphs: input.sub_paragraphs ?? [],
    }).config({ name: "sync-project-sub-paragraphs" })

    const gallery_images = syncProjectGalleryImagesStep({
      project_id: input.id,
      gallery_images: input.gallery_images ?? [],
    }).config({ name: "sync-project-gallery-images" })

    return new WorkflowResponse({
      project,
      metrics,
      sub_paragraphs,
      gallery_images,
    })
  }
)
