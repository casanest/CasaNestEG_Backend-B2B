import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { SOCIAL_MEDIA_MODULE } from "../../../modules/social-media"
import SocialMediaModuleService from "../../../modules/social-media/service"

type CreateSocialMediaStepInput = {
  platform: string
  url: string
  label?: string | null
  display_order?: number
  is_published?: boolean
}

export const createSocialMediaStep = createStep(
  "create-social-media-step",
  async (input: CreateSocialMediaStepInput, { container }) => {
    const socialMediaModule = container.resolve<
      InstanceType<typeof SocialMediaModuleService>
    >(SOCIAL_MEDIA_MODULE)

    const socialMedia = await socialMediaModule.createSocialMedias(input)

    return new StepResponse(socialMedia, socialMedia.id)
  },
  async (socialMediaId: string, { container }) => {
    if (!socialMediaId) return
    const socialMediaModule = container.resolve<
      InstanceType<typeof SocialMediaModuleService>
    >(SOCIAL_MEDIA_MODULE)
    await socialMediaModule.deleteSocialMedias(socialMediaId)
  }
)
