import { model } from "@medusajs/framework/utils"

export const BannerType = {
  HERO: "hero",
  MOBILE_HERO: "mobile_hero",
  PAST_CUSTOMER: "past_customer",
  PARTNERS: "partners",
} as const

const Banner = model.define("banner", {
  id: model.id().primaryKey(),
  image_url: model.text(),
  type: model.enum(BannerType).default(BannerType.HERO),
  is_active: model.boolean().default(false),
  display_order: model.number().default(0),
})

export default Banner
