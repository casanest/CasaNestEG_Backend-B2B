import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PACKAGE_MODULE } from "../../../modules/package"
import PackageModuleService from "../../../modules/package/service"

type UpdatePackageStepInput = {
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

export const updatePackageStep = createStep(
  "update-package-step",
  async (input: UpdatePackageStepInput, { container }) => {
    const packageModule = container.resolve<
      InstanceType<typeof PackageModuleService>
    >(PACKAGE_MODULE)

    const original = await packageModule.retrievePackage(input.id)

    const updateData: Record<string, any> = { id: input.id }
    if (input.slug !== undefined) updateData.slug = input.slug
    if (input.name_en !== undefined) updateData.name_en = input.name_en
    if (input.name_ar !== undefined) updateData.name_ar = input.name_ar
    if (input.description_en !== undefined) updateData.description_en = input.description_en
    if (input.description_ar !== undefined) updateData.description_ar = input.description_ar
    if (input.image_url !== undefined) updateData.image_url = input.image_url
    if (input.is_published !== undefined) updateData.is_published = input.is_published
    if (input.is_in_homepage !== undefined) updateData.is_in_homepage = input.is_in_homepage

    const updated = await packageModule.updatePackages(updateData)

    return new StepResponse(updated, { id: input.id, original })
  },
  async (compensationData: { id: string; original: any }, { container }) => {
    if (!compensationData) return
    const packageModule = container.resolve<
      InstanceType<typeof PackageModuleService>
    >(PACKAGE_MODULE)
    await packageModule.updatePackages({
      id: compensationData.id,
      slug: compensationData.original.slug,
      name_en: compensationData.original.name_en,
      name_ar: compensationData.original.name_ar,
      description_en: compensationData.original.description_en,
      description_ar: compensationData.original.description_ar,
      image_url: compensationData.original.image_url,
      is_published: compensationData.original.is_published,
      is_in_homepage: compensationData.original.is_in_homepage,
    })
  }
)
