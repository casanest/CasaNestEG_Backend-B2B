import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createPackageTitleWorkflow } from "../../../../../workflows/package/create-package-title"
import { PACKAGE_MODULE } from "../../../../../modules/package"
import PackageModuleService from "../../../../../modules/package/service"
import type { PostAdminPackageTitleSchema } from "../../validators"

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminPackageTitleSchema>,
  res: MedusaResponse
) {
  const { id } = req.params
  const packageModule = req.scope.resolve<
    InstanceType<typeof PackageModuleService>
  >(PACKAGE_MODULE)

  const existingTitles = await packageModule.listPackageTitles({
    package_id: id,
  })

  const display_order = existingTitles.length

  const { result } = await createPackageTitleWorkflow(req.scope).run({
    input: {
      package_id: id,
      name_en: req.validatedBody.name_en,
      name_ar: req.validatedBody.name_ar,
      display_order,
    },
  })

  res.json({ title: result.title })
}
