import { model } from "@medusajs/framework/utils"
import Project from "./project"

const ProjectCategory = model.define("project_category", {
  id: model.id().primaryKey(),
  slug: model.text().unique(),
  name_en: model.text(),
  name_ar: model.text(),
  projects: model.hasMany(() => Project, {
    mappedBy: "category",
  }),
})

export default ProjectCategory
