import { model } from "@medusajs/framework/utils"
import Project from "./project"

const ProjectSubParagraph = model.define("project_sub_paragraph", {
  id: model.id().primaryKey(),
  heading_en: model.text(),
  heading_ar: model.text(),
  text_en: model.text(),
  text_ar: model.text(),
  image_url: model.text().nullable(),
  display_order: model.number().default(0),
  project: model.belongsTo(() => Project, {
    mappedBy: "sub_paragraphs",
  }),
})

export default ProjectSubParagraph
