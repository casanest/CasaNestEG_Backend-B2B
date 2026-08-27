import { model } from "@medusajs/framework/utils"
import Package from "./package"

const PackageTitle = model.define("package_title", {
  id: model.id().primaryKey(),
  name_en: model.text(),
  name_ar: model.text(),
  display_order: model.number().default(0),
  package: model.belongsTo(() => Package, {
    mappedBy: "titles",
  }),
})

export default PackageTitle
