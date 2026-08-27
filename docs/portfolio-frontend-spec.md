# Projects Portfolio — Frontend Implementation Spec

## Overview

The backend exposes **3 store API endpoints** for the portfolio feature. The frontend should build:

1. **Portfolio landing page** — category cards + featured projects
2. **Category page** — paginated project grid filtered by category
3. **Project detail page** — hero image, metrics, sub-paragraphs, gallery

All content is **bilingual (English / Arabic)**. Use the `*_en` fields when locale is English and `*_ar` fields when locale is Arabic. Set `dir="rtl"` on Arabic text containers.

---

## Base URL

```
STORE_API_BASE=https://api.casanesteg.com   (production)
DEV=http://localhost:9000                    (local dev)
```

All endpoints below are relative to the base URL.

---

## API Endpoints

### 1. List All Categories

```
GET /store/portfolio/categories
```

**Query params:** none

**Response (200):**

```json
{
  "categories": [
    {
      "id": "01M0W4HM1JVQCH9K8N3JJW6KZF",
      "slug": "hotels",
      "name_en": "Hotels",
      "name_ar": "فنادق",
      "created_at": "2026-08-25T09:50:00.000Z",
      "updated_at": "2026-08-25T09:50:00.000Z"
    }
  ]
}
```

---

### 2. List Projects by Category (Paginated)

```
GET /store/portfolio/categories/:slug/projects
```

**Path params:**

| Param  | Type   | Description            |
|--------|--------|------------------------|
| slug   | string | Category slug (e.g. `hotels`) |

**Query params:**

| Param  | Type   | Default | Description                |
|--------|--------|---------|----------------------------|
| page   | number | 1       | Page number (1-indexed)    |
| limit  | number | 12      | Items per page (max 100)   |

**Response (200):**

```json
{
  "category": {
    "id": "01M0W4HM1JVQCH9K8N3JJW6KZF",
    "slug": "hotels",
    "name_en": "Hotels",
    "name_ar": "فنادق"
  },
  "projects": [
    {
      "id": "01M0W5011N74348HFJTGN4EE24",
      "slug": "grand-hotel-cairo",
      "title_en": "Grand Hotel Cairo",
      "title_ar": "فندق جراند القاهرة",
      "location_en": "Cairo, Egypt",
      "location_ar": "القاهرة، مصر",
      "hero_image_url": "https://media.casanesteg.com/hero.webp",
      "project_date": "2019-06-20T00:00:00.000Z",
      "is_in_homepage": true
    }
  ],
  "count": 25,
  "page": 1,
  "limit": 12
}
```

**Error (404):** Category not found

---

### 3. Project Detail

```
GET /store/portfolio/projects/:slug
```

**Path params:**

| Param  | Type   | Description           |
|--------|--------|-----------------------|
| slug   | string | Project slug (e.g. `grand-hotel-cairo`) |

**Response (200):**

```json
{
  "project": {
    "id": "01M0W5011N74348HFJTGN4EE24",
    "category_id": "01M0W4HM1JVQCH9K8N3JJW6KZF",
    "slug": "grand-hotel-cairo",
    "title_en": "Grand Hotel Cairo",
    "title_ar": "فندق جراند القاهرة",
    "location_en": "Cairo, Egypt",
    "location_ar": "القاهرة، مصر",
    "hero_image_url": "https://media.casanesteg.com/hero.webp",
    "project_date": "2019-06-20T00:00:00.000Z",
    "is_in_homepage": true,
    "created_at": "2026-08-25T09:51:00.000Z",
    "updated_at": "2026-08-25T10:30:00.000Z",
    "category": {
      "id": "01M0W4HM1JVQCH9K8N3JJW6KZF",
      "slug": "hotels",
      "name_en": "Hotels",
      "name_ar": "فنادق"
    },
    "metrics": [
      {
        "id": "01M0W5011VTJQTPNG786GV2HPB",
        "label_en": "Products delivered",
        "label_ar": "منتجات تم توصيلها",
        "value_en": "1250",
        "value_ar": "1250",
        "display_order": 0
      }
    ],
    "sub_paragraphs": [
      {
        "id": "01M0W5012G63SJ65A1VW2PN827",
        "heading_en": "Project overview",
        "heading_ar": "نظرة عامة على المشروع",
        "text_en": "A comprehensive furniture and fit-out package...",
        "text_ar": "مجموعة شاملة من الأثاث والتجهيزات...",
        "image_url": "https://media.casanesteg.com/section1.webp",
        "display_order": 0
      }
    ],
    "gallery_images": [
      {
        "id": "01M0W50137JSZ7TEFJNXM3R386",
        "image_url": "https://media.casanesteg.com/gallery1.webp",
        "display_order": 0
      }
    ]
  }
}
```

**Error (404):** Project not found

> **Important:** `metrics`, `sub_paragraphs`, and `gallery_images` are already sorted by `display_order` ascending in the API response. No client-side sorting needed.

---

## TypeScript Types

```typescript
// ─── Category ───
interface PortfolioCategory {
  id: string
  slug: string
  name_en: string
  name_ar: string
  created_at?: string
  updated_at?: string
}

// ─── Project (list view — no nested relations) ───
interface PortfolioProjectListItem {
  id: string
  slug: string
  title_en: string
  title_ar: string
  location_en: string
  location_ar: string
  hero_image_url: string
  project_date: string        // ISO date string
  is_in_homepage: boolean
}

// ─── Metric ───
interface PortfolioMetric {
  id: string
  label_en: string
  label_ar: string
  value_en: string
  value_ar: string
  display_order: number
}

// ─── Sub-Paragraph ───
interface PortfolioSubParagraph {
  id: string
  heading_en: string
  heading_ar: string
  text_en: string
  text_ar: string
  image_url: string | null
  display_order: number
}

// ─── Gallery Image ───
interface PortfolioGalleryImage {
  id: string
  image_url: string
  display_order: number
}

// ─── Project (detail view — with nested relations) ───
interface PortfolioProjectDetail {
  id: string
  category_id: string
  slug: string
  title_en: string
  title_ar: string
  location_en: string
  location_ar: string
  hero_image_url: string
  project_date: string        // ISO date string
  is_in_homepage: boolean
  created_at: string
  updated_at: string
  category: PortfolioCategory | null
  metrics: PortfolioMetric[]
  sub_paragraphs: PortfolioSubParagraph[]
  gallery_images: PortfolioGalleryImage[]
}

// ─── API Response Types ───
interface CategoriesResponse {
  categories: PortfolioCategory[]
}

interface ProjectsByCategoryResponse {
  category: PortfolioCategory
  projects: PortfolioProjectListItem[]
  count: number
  page: number
  limit: number
}

interface ProjectDetailResponse {
  project: PortfolioProjectDetail
}
```

---

## Suggested Pages & Routes

### Route 1: `/portfolio` — Portfolio Landing

**Data needed:**
- `GET /store/portfolio/categories` — all categories
- `GET /store/portfolio/categories/:slug/projects?limit=4` for each category — preview projects (or fetch all and filter `is_in_homepage === true` for a featured section)

**UI sections:**
1. **Page header** — title + intro text
2. **Featured projects** — horizontal scroll or grid of projects where `is_in_homepage === true` (fetch from all categories or a dedicated section)
3. **Category cards** — each category card links to `/portfolio/:categorySlug`
   - Show category name (bilingual)
   - Show project count if available
   - Use a representative image (first project's `hero_image_url`)

### Route 2: `/portfolio/:categorySlug` — Category Projects

**Data needed:**
- `GET /store/portfolio/categories/:slug/projects?page=1&limit=12`

**UI sections:**
1. **Breadcrumb** — Home > Portfolio > Category Name
2. **Category header** — category name (bilingual)
3. **Project grid** — responsive grid (3-4 columns desktop, 2 tablet, 1 mobile)
   - Each card shows: `hero_image_url`, title (bilingual), location (bilingual), formatted `project_date`
   - Card links to `/portfolio/:categorySlug/:projectSlug`
4. **Pagination** — page numbers or load-more button using `count`, `page`, `limit`

### Route 3: `/portfolio/:categorySlug/:projectSlug` — Project Detail

**Data needed:**
- `GET /store/portfolio/projects/:slug`

**UI sections:**
1. **Breadcrumb** — Home > Portfolio > Category Name > Project Title
2. **Hero section** — full-width `hero_image_url` with project title, location, and date overlaid
3. **Metrics row** — horizontal row of metric cards (value + label), bilingual
4. **Sub-paragraphs** — alternating left/right layout for each section:
   - Heading (bilingual)
   - Body text (bilingual)
   - Image (`image_url` if not null)
   - Render in `display_order` sequence
5. **Gallery** — grid or lightbox of `gallery_images`:
   - Responsive grid (3-4 columns)
   - Optional: click to open lightbox/modal
   - Images ordered by `display_order`
6. **Back button** — link back to category page
7. **Next/prev project** — optional navigation between projects in the same category

---

## Bilingual Field Helper

```typescript
type Locale = "en" | "ar"

function localizedField<T extends Record<string, any>>(
  obj: T,
  field: string,
  locale: Locale
): string {
  return obj[`${field}_${locale}`] ?? obj[`${field}_en`] ?? ""
}

// Usage:
// localizedField(project, "title", "ar")  → project.title_ar
// localizedField(metric, "label", "en")   → metric.label_en
```

When locale is `"ar"`, set `dir="rtl"` on the container element.

---

## Date Formatting

```typescript
function formatProjectDate(dateStr: string, locale: Locale): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "long",
  })
}

// Usage:
// formatProjectDate("2019-06-20T00:00:00.000Z", "en") → "June 2019"
// formatProjectDate("2019-06-20T00:00:00.000Z", "ar") → "يونيو ٢٠١٩"
```

---

## Image Handling

- All image URLs are absolute URLs (e.g., `https://media.casanesteg.com/...`)
- Use `next/image` or standard `<img>` tags
- Hero images: full-width, aspect ratio 16:9 or 21:9
- Gallery thumbnails: square or 4:3 aspect ratio
- Sub-paragraph images: 16:9 or 4:3, alternating sides
- Use `loading="lazy"` for gallery images below the fold

---

## Error Handling

| Status | Cause                          | UI Action                          |
|--------|--------------------------------|------------------------------------|
| 404    | Category/project not found     | Show "Not Found" page with link to `/portfolio` |
| 500    | Server error                   | Show generic error with retry button |
| Network| Connection failed              | Show offline message               |

---

## Suggested Data Fetching (React)

```typescript
// Fetch all categories
async function fetchCategories(): Promise<PortfolioCategory[]> {
  const res = await fetch(`${API_BASE}/store/portfolio/categories`)
  if (!res.ok) throw new Error("Failed to fetch categories")
  const data: CategoriesResponse = await res.json()
  return data.categories
}

// Fetch projects by category slug (paginated)
async function fetchProjectsByCategory(
  slug: string,
  page: number = 1,
  limit: number = 12
): Promise<ProjectsByCategoryResponse> {
  const res = await fetch(
    `${API_BASE}/store/portfolio/categories/${slug}/projects?page=${page}&limit=${limit}`
  )
  if (!res.ok) throw new Error("Failed to fetch projects")
  return res.json()
}

// Fetch project detail by slug
async function fetchProjectDetail(slug: string): Promise<PortfolioProjectDetail> {
  const res = await fetch(`${API_BASE}/store/portfolio/projects/${slug}`)
  if (!res.ok) throw new Error("Failed to fetch project")
  const data: ProjectDetailResponse = await res.json()
  return data.project
}
```

If using **React Query** / **TanStack Query**:

```typescript
const useCategories = () =>
  useQuery({
    queryKey: ["portfolio-categories"],
    queryFn: fetchCategories,
  })

const useProjectsByCategory = (slug: string, page: number, limit: number = 12) =>
  useQuery({
    queryKey: ["portfolio-projects", slug, page, limit],
    queryFn: () => fetchProjectsByCategory(slug, page, limit),
    enabled: !!slug,
  })

const useProjectDetail = (slug: string) =>
  useQuery({
    queryKey: ["portfolio-project", slug],
    queryFn: () => fetchProjectDetail(slug),
    enabled: !!slug,
  })
```

---

## Notes

- No authentication required for store endpoints (public)
- No caching headers are set by the API — handle caching on the frontend
- `project_date` is an ISO string — parse with `new Date()` for formatting
- `image_url` in sub-paragraphs can be `null` — conditionally render
- `is_in_homepage` flag on projects indicates featured projects for the landing page
- Categories have no images — use the first project's hero image as a category thumbnail if needed
