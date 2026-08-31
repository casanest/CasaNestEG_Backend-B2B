import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { SOCIAL_MEDIA_MODULE } from "../../../modules/social-media"
import SocialMediaModuleService from "../../../modules/social-media/service"

type UpdateSocialMediaStepInput = {
  id: string
  platform?: string
  url?: string
  label?: string | null
  description?: string | null
  display_order?: number
  is_published?: boolean
}

export const updateSocialMediaStep = createStep(
  "update-social-media-step",
  async (input: UpdateSocialMediaStepInput, { container }) => {
    const socialMediaModule = container.resolve<
      InstanceType<typeof SocialMediaModuleService>
    >(SOCIAL_MEDIA_MODULE)

    const original = await socialMediaModule.retrieveSocialMedia(input.id)

    const updateData: Record<string, any> = { id: input.id }
    if (input.platform !== undefined) updateData.platform = input.platform
    if (input.url !== undefined) updateData.url = input.url
    if (input.label !== undefined) updateData.label = input.label
    if (input.description !== undefined) updateData.description = input.description
    if (input.display_order !== undefined) updateData.display_order = input.display_order
    if (input.is_published !== undefined) updateData.is_published = input.is_published

    const updated = await socialMediaModule.updateSocialMedias(updateData)

    return new StepResponse(updated, { id: input.id, original })
  },
  async (compensationData: { id: string; original: any }, { container }) => {
    if (!compensationData) return
    const socialMediaModule = container.resolve<
      InstanceType<typeof SocialMediaModuleService>
    >(SOCIAL_MEDIA_MODULE)
    await socialMediaModule.updateSocialMedias({
      id: compensationData.id,
      platform: compensationData.original.platform,
      url: compensationData.original.url,
      label: compensationData.original.label,
      description: compensationData.original.description,
      display_order: compensationData.original.display_order,
      is_published: compensationData.original.is_published,
    })
  }
)
