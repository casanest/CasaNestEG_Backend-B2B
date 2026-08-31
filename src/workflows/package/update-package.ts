import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { updatePackageStep } from "./steps/update-package"

type UpdatePackageWorkflowInput = {
  id: string
  slug?: string
  name_en?: string
  name_ar?: string
  description_en?: string | null
  description_ar?: string | null
  image_url?: string | null
  is_published?: boolean
  is_in_homepage?: boolean
}

export const updatePackageWorkflow = createWorkflow(
  "update-package",
  function (input: UpdatePackageWorkflowInput) {
    const pkg = updatePackageStep(input)

    return new WorkflowResponse({
      package: pkg,
    })
  }
)
