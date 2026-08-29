import { Module } from "@medusajs/framework/utils"
import TestimonialModuleService from "./service"

export const TESTIMONIAL_MODULE = "testimonial"

export default Module(TESTIMONIAL_MODULE, {
  service: TestimonialModuleService,
})
