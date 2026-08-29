import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { BANNER_MODULE } from "../../../modules/banner"
import BannerModuleService from "../../../modules/banner/service"

export const deleteBannerStep = createStep(
  "delete-banner-step",
  async (input: { id: string }, { container }) => {
    const bannerModule = container.resolve<
      InstanceType<typeof BannerModuleService>
    >(BANNER_MODULE)

    const original = await bannerModule.retrieveBanner(input.id)
    await bannerModule.deleteBanners(input.id)

    return new StepResponse(input.id, { original })
  },
  async (compensationData: { original: any }, { container }) => {
    if (!compensationData) return
    const bannerModule = container.resolve<
      InstanceType<typeof BannerModuleService>
    >(BANNER_MODULE)

    await bannerModule.createBanners({
      image_url: compensationData.original.image_url,
      type: compensationData.original.type,
      is_active: compensationData.original.is_active,
      display_order: compensationData.original.display_order,
    })
  }
)
