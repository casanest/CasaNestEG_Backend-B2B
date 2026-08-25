import { MedusaService } from "@medusajs/framework/utils"
import ProductCustom from "./models/product-custom"

class ProductCustomModuleService extends MedusaService({
  ProductCustom,
}) {}

export default ProductCustomModuleService
