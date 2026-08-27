import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PACKAGE_MODULE } from "../../../modules/package"
import PackageModuleService from "../../../modules/package/service"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}

export const generatePackageSlugStep = createStep(
  "generate-package-slug-step",
  async (
    input: { slug?: string; name_en: string },
    { container }
  ) => {
    const packageModule = container.resolve<
      InstanceType<typeof PackageModuleService>
    >(PACKAGE_MODULE)

    let baseSlug = input.slug?.trim() || slugify(input.name_en)

    if (!baseSlug) {
      baseSlug = "package"
    }

    let slug = baseSlug
    let suffix = 2

    while (true) {
      const existing = await packageModule.listPackages({
        slug,
      })
      if (!existing || existing.length === 0) break
      slug = `${baseSlug}-${suffix}`
      suffix++
    }

    return new StepResponse(slug)
  }
)
