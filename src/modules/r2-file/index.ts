import R2FileService from "./service"
import { ModuleProvider, Modules } from "@medusajs/framework/utils"

export default ModuleProvider(Modules.FILE, {
  services: [R2FileService],
})
