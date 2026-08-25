import { model } from "@medusajs/framework/utils"
import ProjectCategory from "./project-category"
import ProjectMetric from "./project-metric"
import ProjectSubParagraph from "./project-sub-paragraph"
import ProjectGalleryImage from "./project-gallery-image"

const Project = model.define("project", {
  id: model.id().primaryKey(),
  slug: model.text().unique(),
  title_en: model.text(),
  title_ar: model.text(),
  location_en: model.text(),
  location_ar: model.text(),
  hero_image_url: model.text(),
  project_date: model.dateTime(),
  is_in_homepage: model.boolean().default(false),
  category: model.belongsTo(() => ProjectCategory, {
    mappedBy: "projects",
  }),
  metrics: model.hasMany(() => ProjectMetric, {
    mappedBy: "project",
  }),
  sub_paragraphs: model.hasMany(() => ProjectSubParagraph, {
    mappedBy: "project",
  }),
  gallery_images: model.hasMany(() => ProjectGalleryImage, {
    mappedBy: "project",
  }),
})

export default Project
