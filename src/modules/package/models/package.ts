import { model } from "@medusajs/framework/utils"
import PackageTitle from "./package-title"

const Package = model.define("package", {
  id: model.id().primaryKey(),
  slug: model.text().unique(),
  name_en: model.text(),
  name_ar: model.text(),
  description_en: model.text().nullable(),
  description_ar: model.text().nullable(),
  image_url: model.text().nullable(),
  is_published: model.boolean().default(false),
  titles: model.hasMany(() => PackageTitle, {
    mappedBy: "package",
  }),
})

export default Package
