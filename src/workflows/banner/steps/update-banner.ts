import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { BANNER_MODULE } from "../../../modules/banner"
import BannerModuleService from "../../../modules/banner/service"

type UpdateBannerStepInput = {
  id: string
  image_url?: string
  type?: "hero" | "mobile_hero" | "past_customer" | "partners"
  is_active?: boolean
  display_order?: number
}

export const updateBannerStep = createStep(
  "update-banner-step",
  async (input: UpdateBannerStepInput, { container }) => {
    const bannerModule = container.resolve<
      InstanceType<typeof BannerModuleService>
    >(BANNER_MODULE)

    const original = await bannerModule.retrieveBanner(input.id)

    const updateData: Record<string, any> = { id: input.id }
    if (input.image_url !== undefined) updateData.image_url = input.image_url
    if (input.type !== undefined) updateData.type = input.type
    if (input.is_active !== undefined) updateData.is_active = input.is_active
    if (input.display_order !== undefined) updateData.display_order = input.display_order

    const updated = await bannerModule.updateBanners(updateData)

    return new StepResponse(updated, { id: input.id, original })
  },
  async (compensationData: { id: string; original: any }, { container }) => {
    if (!compensationData) return
    const bannerModule = container.resolve<
      InstanceType<typeof BannerModuleService>
    >(BANNER_MODULE)
    await bannerModule.updateBanners({
      id: compensationData.id,
      image_url: compensationData.original.image_url,
      type: compensationData.original.type,
      is_active: compensationData.original.is_active,
      display_order: compensationData.original.display_order,
    })
  }
)
