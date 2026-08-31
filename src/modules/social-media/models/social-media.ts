import { model } from "@medusajs/framework/utils"

const SocialMedia = model.define("social_media", {
  id: model.id().primaryKey(),
  platform: model.text(),
  url: model.text(),
  label: model.text().nullable(),
  description: model.text().nullable(),
  display_order: model.number().default(0),
  is_published: model.boolean().default(false),
})

export default SocialMedia
