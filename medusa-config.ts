// @ts-nocheck
import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const uploadDir = process.env.FILE_UPLOAD_DIR ?? 'static/uploads'
const publicUploadPath = uploadDir.startsWith('static')
  ? `/static${uploadDir.slice('static'.length)}`
  : `/${uploadDir.replace(/^\/+/, '')}`

const backendUrlBase =
  process.env.FILE_PROVIDER_BACKEND_URL ??
  (process.env.MEDUSA_BACKEND_URL
    ? `${process.env.MEDUSA_BACKEND_URL.replace(/\/$/, '')}${publicUploadPath}`
    : `http://localhost:3000${publicUploadPath}`)

const plugins = [
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

const modulesConfig = {
  [Modules.FILE]: {
    resolve: '@medusajs/medusa/file',
    options: {
      providers: [
        {
          resolve: './src/modules/r2-file',
          id: 'r2',
          options: {
            file_url: process.env.R2_PUBLIC_URL,
            access_key_id: process.env.R2_ACCESS_KEY_ID,
            secret_access_key: process.env.R2_SECRET_ACCESS_KEY,
            region: 'auto',
            bucket: process.env.R2_BUCKET,
            endpoint: process.env.R2_ENDPOINT,
            additional_client_config: {
              forcePathStyle: true,
            },
          },
        },
      ],
    },
  },
  [Modules.PAYMENT]: {
    resolve: '@medusajs/medusa/payment',
    options: {
      providers: [
        {
          resolve: './src/modules/tap',
          id: 'tap',
          options: {
            secret_key: process.env.TAP_SECRET_KEY!,
            public_key: process.env.TAP_PUBLIC_KEY!,
            base_url: process.env.TAP_BASE_URL || 'https://api.tap.company/v2',
            debug: process.env.NODE_ENV === 'development',
            domain: process.env.FRONTEND_URL || 'http://localhost:8000',
          },
        },
      ],
    },
  },
  test: {
    resolve: './src/modules/test',
  },
  rfq: {
    resolve: './src/modules/rfq',
  },
  appointments: {
    resolve: './src/modules/appointments',
  },
  productCustom: {
    resolve: './src/modules/productCustom',
  },
  portfolio: {
    resolve: './src/modules/portfolio',
  },
  package: {
    resolve: './src/modules/package',
  },
}

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
    vite: () => {
      return {
        server: {
          allowedHosts: ['admin.lacasa-eg.com'],
        },
      }
    }
  },
  plugins: [...plugins],
  modules: modulesConfig,
})