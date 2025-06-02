import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())
const plugins = [
  // ... other plugins
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
  plugins:[...plugins]
  // modules: [
  //  {
  //     resolve: './src/modules/meilisearch',
  //     /**
  //      * @type {import('./src/modules/meilisearch/types').MeiliSearchPluginOptions}
  //      */
  //     options: {
  //       config: {
  //         host:
  //           process.env.MEILISEARCH_HOST,
  //          apiKey: process.env.MEILISEARCH_API_KEY || 'f91cf0081492ffa10b6919b9314357d194641f94331b41e4540d0efe499a6ddb',
        
  //       },
  //       settings: {
  //         products: {
  //           indexSettings: {
  //             searchableAttributes: [
  //               'title',
  //               'subtitle',
  //               'description',
  //               'collection',
  //               'categories',
  //               'type',
  //               'tags',
  //               'variants',
  //               'sku',
  //             ],
  //             displayedAttributes: [
  //               'id',
  //               'title',
  //               'handle',
  //               'subtitle',
  //               'description',
  //               'is_giftcard',
  //               'status',
  //               'thumbnail',
  //               'collection',
  //               'collection_handle',
  //               'categories',
  //               'categories_handle',
  //               'type',
  //               'tags',
  //               'variants',
  //               'sku',
  //             ],
  //           },
  //           primaryKey: 'id',
  //           /**
  //            * @param {import('@medusajs/types').ProductDTO} product
  //            */
  //           transformer: (product) => {
  //             return {
  //               id: product.id,
  //               title: product.title,
  //               handle: product.handle,
  //               subtitle: product.subtitle,
  //               description: product.description,
  //               is_giftcard: product.is_giftcard,
  //               status: product.status,
  //               thumbnail: product.images?.[0]?.url ?? null,
  //               collection: product.collection.title,
  //               collection_handle: product.collection.handle,
  //               categories:
  //                 product.categories?.map((category) => category.name) ?? [],
  //               categories_handle:
  //                 product.categories?.map((category) => category.handle) ?? [],
  //               type: product.type?.value,
  //               tags: product.tags.map((tag) => tag.value),
  //               variants: product.variants.map((variant) => variant.title),
  //               sku: product.variants
  //                 .filter(
  //                   (variant) => typeof variant.sku === 'string' && variant.sku,
  //                 )
  //                 .map((variant) => variant.sku),
  //             };
  //           },
  //         },
  //       },
  //     },
  //   },
  // ],
  
})

