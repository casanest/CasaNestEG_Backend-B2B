import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { BANNER_MODULE } from "../../../modules/banner"
import BannerModuleService from "../../../modules/banner/service"

type CreateBannerStepInput = {
  image_url: string
  type?: "hero" | "past_customer" | "partners"
  is_active?: boolean
  display_order?: number
}

export const createBannerStep = createStep(
  "create-banner-step",
  async (input: CreateBannerStepInput, { container }) => {
    const bannerModule = container.resolve<
      InstanceType<typeof BannerModuleService>
    >(BANNER_MODULE)

    const banner = await bannerModule.createBanners(input)

    return new StepResponse(banner, banner.id)
  },
  async (bannerId: string, { container }) => {
    if (!bannerId) return
    const bannerModule = container.resolve<
      InstanceType<typeof BannerModuleService>
    >(BANNER_MODULE)
    await bannerModule.deleteBanners(bannerId)
  }
)
