import { model } from "@medusajs/framework/utils"

const Testimonial = model.define("testimonial", {
  id: model.id().primaryKey(),
  name_en: model.text(),
  name_ar: model.text(),
  image_url: model.text().nullable(),
  quote_en: model.text(),
  quote_ar: model.text(),
  position_en: model.text(),
  position_ar: model.text(),
  display_order: model.number().default(0),
  is_published: model.boolean().default(false),
})

export default Testimonial
