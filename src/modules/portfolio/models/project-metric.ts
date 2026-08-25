import { model } from "@medusajs/framework/utils"
import Project from "./project"

const ProjectMetric = model.define("project_metric", {
  id: model.id().primaryKey(),
  label_en: model.text(),
  label_ar: model.text(),
  value_en: model.text(),
  value_ar: model.text(),
  display_order: model.number().default(0),
  project: model.belongsTo(() => Project, {
    mappedBy: "metrics",
  }),
})

export default ProjectMetric
