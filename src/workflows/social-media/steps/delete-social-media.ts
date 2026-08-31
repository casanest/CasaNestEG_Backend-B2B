import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { SOCIAL_MEDIA_MODULE } from "../../../modules/social-media"
import SocialMediaModuleService from "../../../modules/social-media/service"

export const deleteSocialMediaStep = createStep(
  "delete-social-media-step",
  async (input: { id: string }, { container }) => {
    const socialMediaModule = container.resolve<
      InstanceType<typeof SocialMediaModuleService>
    >(SOCIAL_MEDIA_MODULE)

    const original = await socialMediaModule.retrieveSocialMedia(input.id)
    await socialMediaModule.deleteSocialMedias(input.id)

    return new StepResponse(input.id, { original })
  },
  async (compensationData: { original: any }, { container }) => {
    if (!compensationData) return
    const socialMediaModule = container.resolve<
      InstanceType<typeof SocialMediaModuleService>
    >(SOCIAL_MEDIA_MODULE)

    await socialMediaModule.createSocialMedias({
      platform: compensationData.original.platform,
      url: compensationData.original.url,
      label: compensationData.original.label,
      display_order: compensationData.original.display_order,
      is_published: compensationData.original.is_published,
    })
  }
)
