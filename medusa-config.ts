// @ts-nocheck
import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())
const plugins = [
   {
      resolve: "@medusajs/file-local",
      options: {
        upload_dir: "uploads",
      },
    },
  {
    resolve: '@rokmohar/medusa-plugin-meilisearch',
    options: {
      config: {
        host: process.env.MEILISEARCH_HOST ?? '',
        apiKey: process.env.MEILISEARCH_API_KEY ?? '',
      },
      settings: {
        products: {
          type: 'products',
          enabled: true,
          fields: ['id', 'title', 'description', 'handle', 'variant_sku', 'thumbnail', 'metadata'],
          indexSettings: {
            searchableAttributes: [
              'title',
              'description',
              'variant_sku',
              'handle',
              'metadata',
              'metadata.*', // This allows searching on all metadata fields
            ],
            displayedAttributes: [
              'id',
              'handle',
              'title',
              'description',
              'variant_sku',
              'thumbnail',
              'metadata',
            ],
            filterableAttributes: ['id', 'handle', 'metadata', 'metadata.*'],
          },
          primaryKey: 'id',
        },
      },
    },
  },
]
module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  admin: {
    disable: false,
  },
  plugins:[...plugins],
modules: {
[Modules.PAYMENT]:  {
    resolve: "@medusajs/medusa/payment", 
    options: {
      providers: [
        {
          resolve: "./src/modules/tap", 
          id: "tap", 
          options: {
            secret_key: process.env.TAP_SECRET_KEY!,
            public_key: process.env.TAP_PUBLIC_KEY!,
            base_url: process.env.TAP_BASE_URL || "https://api.tap.company/v2",
            debug: process.env.NODE_ENV === "development",
            domain: process.env.FRONTEND_URL || "http://localhost:8000",
          },
        },
      ],
    },
  },
}


  
})

