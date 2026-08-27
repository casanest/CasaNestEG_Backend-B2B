import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { generatePackageSlugStep } from "./steps/generate-package-slug"
import { createPackageStep } from "./steps/create-package"

type CreatePackageWorkflowInput = {
  slug?: string
  name_en: string
  name_ar: string
  description_en?: string | null
  description_ar?: string | null
  image_url?: string | null
  is_published?: boolean
}

export const createPackageWorkflow = createWorkflow(
  "create-package",
  function (input: CreatePackageWorkflowInput) {
    const slug = generatePackageSlugStep({
      slug: input.slug,
      name_en: input.name_en,
    })

    const pkg = createPackageStep({
      slug,
      name_en: input.name_en,
      name_ar: input.name_ar,
      description_en: input.description_en,
      description_ar: input.description_ar,
      image_url: input.image_url,
      is_published: input.is_published,
    })

    return new WorkflowResponse({
      package: pkg,
    })
  }
)
