import { MedusaService } from "@medusajs/framework/utils"
import { Testimonial } from "./models"

class TestimonialModuleService extends MedusaService({
  Testimonial,
}) {}

export default TestimonialModuleService
