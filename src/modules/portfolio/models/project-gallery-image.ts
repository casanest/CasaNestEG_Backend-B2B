import { model } from "@medusajs/framework/utils"
import Project from "./project"

const ProjectGalleryImage = model.define("project_gallery_image", {
  id: model.id().primaryKey(),
  image_url: model.text(),
  display_order: model.number().default(0),
  project: model.belongsTo(() => Project, {
    mappedBy: "gallery_images",
  }),
})

export default ProjectGalleryImage
