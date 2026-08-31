import { Module } from "@medusajs/framework/utils"
import SocialMediaModuleService from "./service"

export const SOCIAL_MEDIA_MODULE = "social-media"

export default Module(SOCIAL_MEDIA_MODULE, {
  service: SocialMediaModuleService,
})
