import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { PACKAGE_MODULE } from "../../../../../../modules/package"
import PackageModuleService from "../../../../../../modules/package/service"
import type { PostAdminReorderTitlesSchema } from "../../../validators"

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminReorderTitlesSchema>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { title_ids } = req.validatedBody
  const packageModule = req.scope.resolve<
    InstanceType<typeof PackageModuleService>
  >(PACKAGE_MODULE)

  for (let i = 0; i < title_ids.length; i++) {
    await packageModule.updatePackageTitles({
      id: title_ids[i],
      display_order: i,
    })
  }

  res.json({ id, title_ids })
}
