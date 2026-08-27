import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { PACKAGE_MODULE } from "../../../modules/package"
import PackageModuleService from "../../../modules/package/service"

export const deletePackageStep = createStep(
  "delete-package-step",
  async (input: { id: string }, { container }) => {
    const packageModule = container.resolve<
      InstanceType<typeof PackageModuleService>
    >(PACKAGE_MODULE)

    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const original = await packageModule.retrievePackage(input.id)
    const titles = await packageModule.listPackageTitles({ package_id: input.id })

    for (const title of titles) {
      const { data: titleData } = await query.graph({
        entity: "package_title",
        fields: ["products.id"],
        filters: { id: title.id },
      })

      const linkedProductIds = (titleData[0]?.products ?? []).map(
        (p: any) => p.id
      )

      for (const productId of linkedProductIds) {
        await remoteLink.dismiss({
          [Modules.PRODUCT]: { product_id: productId },
          [PACKAGE_MODULE]: { package_title_id: title.id },
        })
      }
    }

    await packageModule.deletePackageTitles(titles.map((t: any) => t.id))
    await packageModule.deletePackages(input.id)

    return new StepResponse(input.id, { original, titles })
  },
  async (compensationData: { original: any; titles: any[] }, { container }) => {
    if (!compensationData) return
    const packageModule = container.resolve<
      InstanceType<typeof PackageModuleService>
    >(PACKAGE_MODULE)

    const restored = await packageModule.createPackages({
      slug: compensationData.original.slug,
      name_en: compensationData.original.name_en,
      name_ar: compensationData.original.name_ar,
      description_en: compensationData.original.description_en,
      description_ar: compensationData.original.description_ar,
      image_url: compensationData.original.image_url,
      is_published: compensationData.original.is_published,
    })

    if (compensationData.titles.length > 0) {
      await packageModule.createPackageTitles(
        compensationData.titles.map((t) => ({
          package_id: restored.id,
          name_en: t.name_en,
          name_ar: t.name_ar,
          display_order: t.display_order,
        }))
      )
    }
  }
)
