import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PACKAGE_MODULE } from "../../../modules/package"
import PackageModuleService from "../../../modules/package/service"

type CreateTitleStepInput = {
  package_id: string
  name_en: string
  name_ar: string
  display_order?: number
}

export const createPackageTitleStep = createStep(
  "create-package-title-step",
  async (input: CreateTitleStepInput, { container }) => {
    const packageModule = container.resolve<
      InstanceType<typeof PackageModuleService>
    >(PACKAGE_MODULE)

    const title = await packageModule.createPackageTitles(input)

    return new StepResponse(title, title.id)
  },
  async (titleId: string, { container }) => {
    if (!titleId) return
    const packageModule = container.resolve<
      InstanceType<typeof PackageModuleService>
    >(PACKAGE_MODULE)
    await packageModule.deletePackageTitles(titleId)
  }
)
