import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PACKAGE_MODULE } from "../../../modules/package"
import PackageModuleService from "../../../modules/package/service"

type UpdateTitleStepInput = {
  id: string
  name_en?: string
  name_ar?: string
  display_order?: number
}

export const updatePackageTitleStep = createStep(
  "update-package-title-step",
  async (input: UpdateTitleStepInput, { container }) => {
    const packageModule = container.resolve<
      InstanceType<typeof PackageModuleService>
    >(PACKAGE_MODULE)

    const original = await packageModule.retrievePackageTitle(input.id)

    const updateData: Record<string, any> = { id: input.id }
    if (input.name_en !== undefined) updateData.name_en = input.name_en
    if (input.name_ar !== undefined) updateData.name_ar = input.name_ar
    if (input.display_order !== undefined) updateData.display_order = input.display_order

    const updated = await packageModule.updatePackageTitles(updateData)

    return new StepResponse(updated, { id: input.id, original })
  },
  async (compensationData: { id: string; original: any }, { container }) => {
    if (!compensationData) return
    const packageModule = container.resolve<
      InstanceType<typeof PackageModuleService>
    >(PACKAGE_MODULE)
    await packageModule.updatePackageTitles({
      id: compensationData.id,
      name_en: compensationData.original.name_en,
      name_ar: compensationData.original.name_ar,
      display_order: compensationData.original.display_order,
    })
  }
)
