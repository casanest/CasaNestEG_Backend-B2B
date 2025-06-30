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
  plugins:[...plugins],
modules: {
[Modules.PAYMENT]:  {
    resolve: "@medusajs/medusa/payment", 
    options: {
      providers: [
     
        {
          resolve: "./src/modules/paymob", 
          id: "paymob", 
          options: {
            api_key: process.env.PAYMOB_API_KEY!,
            integration_id: process.env.PAYMOB_INTEGRATION_ID!,
            iframe_id: process.env.PAYMOB_IFRAME_ID!,
            installments_iframe_id: process.env.PAYMOB_INSTALLMENTS_IFRAME_ID!,
            hmac_secret: process.env.PAYMOB_HMAC_SECRET!,
            base_url: process.env.PAYMOB_BASE_URL || "https://accept.paymob.com/api",
            timeout: Number.parseInt(process.env.PAYMOB_TIMEOUT || "30000"),
            retry_attempts: Number.parseInt(process.env.PAYMOB_RETRY_ATTEMPTS || "3"),
          },
        },
        // {
        //   resolve: "./src/modules/fawry", // Path to your Fawry module index
        //   id: "fawry", // Unique identifier for this provider
        //   options: {
        //     merchant_code: process.env.FAWRY_MERCHANT_CODE!,
        //     security_key: process.env.FAWRY_SECURITY_KEY!,
        //     base_url: process.env.FAWRY_BASE_URL || "https://atfawry.fawrystaging.com",
        //     webhook_secret: process.env.FAWRY_WEBHOOK_SECRET || process.env.FAWRY_SECURITY_KEY!, // Fallback to security_key if specific webhook secret isn't set
        //     timeout: Number.parseInt(process.env.FAWRY_TIMEOUT || "30000"),
        //     retry_attempts: Number.parseInt(process.env.FAWRY_RETRY_ATTEMPTS || "3"),
        //   },
        // },
      ],
    },
  },
}


  
})

