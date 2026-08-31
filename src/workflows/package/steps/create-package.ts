import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PACKAGE_MODULE } from "../../../modules/package"
import PackageModuleService from "../../../modules/package/service"

type CreatePackageStepInput = {
  slug: string
  name_en: string
  name_ar: string
  description_en?: string | null
  description_ar?: string | null
  image_url?: string | null
  is_published?: boolean
  is_in_homepage?: boolean
}

export const createPackageStep = createStep(
  "create-package-step",
  async (input: CreatePackageStepInput, { container }) => {
    const packageModule = container.resolve<
      InstanceType<typeof PackageModuleService>
    >(PACKAGE_MODULE)

    const pkg = await packageModule.createPackages(input)

    return new StepResponse(pkg, pkg.id)
  },
  async (packageId: string, { container }) => {
    if (!packageId) return
    const packageModule = container.resolve<
      InstanceType<typeof PackageModuleService>
    >(PACKAGE_MODULE)
    await packageModule.deletePackages(packageId)
  }
)
