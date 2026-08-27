import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { PACKAGE_MODULE } from "../../../modules/package"
import PackageModuleService from "../../../modules/package/service"

export const deletePackageTitleStep = createStep(
  "delete-package-title-step",
  async (input: { id: string }, { container }) => {
    const packageModule = container.resolve<
      InstanceType<typeof PackageModuleService>
    >(PACKAGE_MODULE)

    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const original = await packageModule.retrievePackageTitle(input.id)

    const { data: titleData } = await query.graph({
      entity: "package_title",
      fields: ["products.id"],
      filters: { id: input.id },
    })

    const linkedProductIds = (titleData[0]?.products ?? []).map(
      (p: any) => p.id
    )

    for (const productId of linkedProductIds) {
      await remoteLink.dismiss({
        [Modules.PRODUCT]: { product_id: productId },
        [PACKAGE_MODULE]: { package_title_id: input.id },
      })
    }

    await packageModule.deletePackageTitles(input.id)

    return new StepResponse(input.id, original)
  },
  async (original: any, { container }) => {
    if (!original) return
    const packageModule = container.resolve<
      InstanceType<typeof PackageModuleService>
    >(PACKAGE_MODULE)
    await packageModule.createPackageTitles({
      package_id: original.package_id,
      name_en: original.name_en,
      name_ar: original.name_ar,
      display_order: original.display_order,
    })
  }
)
