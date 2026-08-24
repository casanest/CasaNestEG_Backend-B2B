# Medusa v2 Feature Development — Agent Operating Manual

You are an autonomous coding agent working inside an existing **Medusa v2** backend.
This document is your operating procedure. It is not background reading — it is a
checklist you execute, in order, for every feature request. When a step gives you an
exact command or exact code shape, use it exactly. Do not improvise syntax you are
unsure of; copy the templates in Section 6 and fill in the blanks.

---

## 0. Prime Directive

Medusa v2 is extended, never edited. You add new files in `src/`. You do not change
anything under:

- `node_modules/`
- any `@medusajs/*` package source
- generated files (anything under a module's `migrations/` folder that you did not
  just generate yourself, and any `.medusa/` build output)

If a feature seems to require changing core behavior, it doesn't. Medusa gives you
three extension mechanisms instead — use one of them:

| You want to...                              | Use this, not core edits            |
|----------------------------------------------|--------------------------------------|
| Add a new data model / domain concept         | A new **module** (Section 6.1–6.3)  |
| Attach your model's data to a core entity (Product, Order, Customer...) | A **module link** (Section 6.5), never add a column to the core table |
| Run logic after/around a core action (e.g. after a product is created) | A **workflow hook** on the core workflow (Section 6.6b), never edit the core workflow file |
| React to something happening                 | A **subscriber** (Section 6.10)     |

If you cannot find a way to do something without touching core, stop and say so
explicitly instead of editing core files.

---

## 1. Non-Negotiable Rules

**Always:**
- Inspect the existing project before writing anything (Section 4, Step 0).
- Put business logic in a module **service**, never in an API route or a React component.
- Put multi-step / multi-system operations in a **workflow**, never inline in a route.
- Validate every request body and query with a **Zod schema** via `middlewares.ts`.
- Generate migrations with the CLI. Never hand-write a migration file.
- Reuse an existing service, hook, validator, or UI component if one already covers
  the need. Search for it before creating a new one.
- Keep API route handlers thin: parse → call workflow/service → respond.

**Never:**
- Never add a column to a core Medusa table (`product`, `order`, `customer`, ...).
  Use a module + module link instead.
- Never edit a core workflow file. Use `.hooks.<stepName>()` on it instead.
- Never put secrets, hardcoded IDs, or environment-specific values in code.
- Never skip authentication on an `/admin` route.
- Never introduce a second UI library, HTTP client, or state-management pattern in
  the Admin dashboard if the project already has one in use.
- Never mark a feature done without running the migration and hitting the endpoint
  at least once (Section 8).

---

## 2. Mental Model

```
Client Request
      │
      ▼
API Route (src/api/**/route.ts)        — parses input, calls a workflow, returns JSON
      │
      ▼
Workflow (src/workflows/**.ts)         — orchestrates steps, only for multi-step ops
      │
      ▼
Module Service (src/modules/**/service.ts)  — CRUD + business rules for one domain
      │
      ▼
Data Model (src/modules/**/models/**.ts)    — one Postgres table, via model.define()
```

A **subscriber** (`src/subscribers/**.ts`) sits off to the side: it listens for an
event name and typically calls a workflow. It is not part of the request/response
chain above.

Simple, single-model CRUD can skip the workflow layer and have the route call the
service directly. Anything that touches more than one system, must roll back on
failure, or triggers side effects (emails, external APIs, other modules) goes
through a workflow. See Section 5 for the exact decision rule.

---

## 3. Directory Map

```
src/
├── admin/
│   ├── routes/<route-name>/page.tsx    → new sidebar page at /app/<route-name>
│   ├── widgets/<widget-name>.tsx       → injected into an existing page's zone
│   ├── components/                     → shared Admin UI pieces, reuse first
│   └── hooks/api/<feature>.ts          → react-query hooks wrapping fetch calls
│
├── api/
│   ├── admin/<path>/route.ts           → POST/GET/... at /admin/<path> (auth required)
│   ├── store/<path>/route.ts           → POST/GET/... at /store/<path> (publishable key)
│   ├── middlewares.ts                  → ONE file, registers validation per route
│   └── webhooks/                       → inbound webhook receivers
│
├── modules/
│   └── <module-name>/
│       ├── models/<model>.ts           → model.define(...)
│       ├── service.ts                  → extends MedusaService({...})
│       ├── index.ts                    → Module(MODULE_NAME, { service })
│       └── migrations/                 → generated, never hand-edited
│
├── links/
│   └── <a>-<b>.ts                      → defineLink(...) between two modules
│
├── workflows/
│   └── <workflow-name>/
│       ├── steps/<step-name>.ts        → createStep(...)
│       └── index.ts                    → createWorkflow(...)
│
├── subscribers/
│   └── <event-name>.ts                 → default export + `config: SubscriberConfig`
│
└── scripts/                            → one-off scripts run via `npx medusa exec`
```

File path → route path examples:

```
src/api/admin/rfq/route.ts               ->  /admin/rfq
src/api/store/wishlist/[id]/route.ts     ->  /store/wishlist/:id
src/admin/routes/vendors/page.tsx        ->  /app/vendors
```

---

## 4. THE ALGORITHM

Execute these steps, in order, for **every** feature. Do not skip a step because it
seems obvious — "obvious" is exactly where a fast/low-reasoning pass introduces bugs.

**Step 0 — Inspect before you write anything.**
```bash
ls src/modules                 # does a similar module already exist?
grep -rl "MedusaService" src/modules | head
cat src/api/middlewares.ts     # see existing validation patterns
ls src/workflows
```
Find the module/route/workflow most similar to what you're about to build and mirror
its structure, naming, and error handling exactly.

**Step 1 — Classify the feature size.** Use Section 5. This decides which layers you
need. Do not add a workflow to a feature that doesn't need one; do not skip the
workflow for one that does.

**Step 2 — Design the data model(s), if any.**
Decide: does this belong in a brand-new module, or does it attach to a core entity
(Product, Order, Customer, etc.)? If it attaches to a core entity, you still create a
**separate module** for your new data and connect it with a **module link**
(Section 6.5) — you do not add fields to the core model.

**Step 3 — Scaffold the module.**
Create, in this order: `models/<model>.ts` → `service.ts` → `index.ts`
(templates: Section 6.1–6.3).

**Step 4 — Register the module.**
Add it to the `modules` array in `medusa-config.ts` (Section 6.3). The module cannot
be resolved anywhere else until this is done.

**Step 5 — Generate and run the migration.**
```bash
npx medusa db:generate <module-name>
# open the generated file under src/modules/<module-name>/migrations/
# confirm it only creates/alters tables for THIS module — nothing else
npx medusa db:migrate
```
If the diff touches a table outside this module, stop — something is wrong with the
model definition; do not run the migration.

**Step 6 — If this feature attaches to a core entity, define the link.**
Create `src/links/<a>-<b>.ts` (Section 6.5), then:
```bash
npx medusa db:sync-links     # or npx medusa db:migrate
```

**Step 7 — Write the workflow (Medium/Large features only).**
One `createStep` per side effect, composed in one `createWorkflow`. Every step that
mutates state gets a compensation function (Section 6.6).

**Step 8 — Write the Zod validators, then the API route.**
Validators first (`validators.ts`), registered in `src/api/middlewares.ts`, then the
`route.ts` handler that calls the workflow (or service, for trivial CRUD) and returns
JSON. Admin routes go under `src/api/admin/**`; storefront routes under
`src/api/store/**`.

**Step 9 — Add a subscriber, only if this feature reacts to an event** it doesn't
itself trigger synchronously (e.g. "when a product is created, also do X"). The
subscriber should call a workflow, not contain business logic itself.

**Step 10 — Build the Admin UI, only if a human needs to see/manage this.**
Reuse existing `src/admin/components`, `src/admin/hooks/api/*` patterns before
writing new ones. A new page is a route (Section 6.11); an addition to an existing
page is a widget (Section 6.12).

**Step 11 — Test it for real.** Follow Section 8 exactly — get a token, hit the
endpoint, check the response and the database row.

**Step 12 — Run the Final Quality Gate (Section 9)** before considering the feature
done.

---

## 5. Feature Size Classifier

| Size | Signal | Required layers |
|---|---|---|
| **Small** | Single model, no cross-system side effects, no rollback risk. Examples: a settings endpoint, a simple list/detail CRUD, a read-only report endpoint. | API Route → Service → Model. No workflow. |
| **Medium** | Multiple steps, or one step with a side effect that needs rollback (create a row **and** call an external API). Examples: RFQ, wishlist, product comparison, "create order + reserve inventory". | API Route → Workflow → Service → Model. |
| **Large** | Multiple modules, multiple services, event-driven side effects, Admin UI. Examples: marketplace/vendor system, subscription billing, ERP sync, multi-provider shipping (courier + in-house). | Admin UI → API → Workflow(s) → Multiple Services/Modules → Links → Subscribers. |

If you're unsure between Small and Medium, ask: **"If step 2 fails, does step 1's
work need to be undone?"** If yes, it's Medium — you need a workflow with
compensation, not a bare service call.

---

## 6. Canonical Templates

Copy these exactly. Replace `<PascalCase>`, `<camelCase>`, `<kebab-case>` placeholders
consistently within one feature.

### 6.1 Data Model

`src/modules/<kebab-name>/models/<kebab-model>.ts`
```ts
import { model } from "@medusajs/framework/utils"

const <PascalModel> = model.define("<snake_model>", {
  id: model.id().primaryKey(),
  // scalar fields:
  title: model.text(),
  notes: model.text().nullable(),
  status: model.enum(["pending", "active", "archived"]).default("pending"),
  // a plain reference to a core entity when you DON'T need query.graph joins:
  product_id: model.text(),
})

export default <PascalModel>
```

### 6.2 Module Service

`src/modules/<kebab-name>/service.ts`
```ts
import { MedusaService } from "@medusajs/framework/utils"
import <PascalModel> from "./models/<kebab-model>"

class <PascalName>ModuleService extends MedusaService({
  <PascalModel>,
}) {
  // MedusaService already generates, for each model above:
  //   create<PascalModel>s(data)   update<PascalModel>s(selector, data)
  //   delete<PascalModel>s(id)     retrieve<PascalModel>(id)
  //   list<PascalModel>s(filters)  listAndCount<PascalModel>s(filters)
  //
  // Only add methods here for logic beyond plain CRUD.
  async <customBusinessMethod>(/* args */) {
    // e.g. combine a create + a business rule check
  }
}

export default <PascalName>ModuleService
```

### 6.3 Module Definition + Registration

`src/modules/<kebab-name>/index.ts`
```ts
import { Module } from "@medusajs/framework/utils"
import <PascalName>ModuleService from "./service"

export const <SCREAMING_NAME>_MODULE = "<kebab-name>"

export default Module(<SCREAMING_NAME>_MODULE, {
  service: <PascalName>ModuleService,
})
```

`medusa-config.ts` — add one entry to the array (create the array if it doesn't exist):
```ts
modules: [
  {
    resolve: "./src/modules/<kebab-name>",
  },
],
```

### 6.4 Migrations — commands only

```bash
npx medusa db:generate <kebab-name>   # writes a migration file, review it
npx medusa db:migrate                 # applies all pending migrations
npx medusa db:sync-links              # syncs only link tables, no other migrations
npx medusa db:rollback <kebab-name>   # undo last batch for this module, if needed
```
Never write SQL or a migration file by hand. If `db:generate` produces a diff that
drops or alters a table belonging to a different module, do not run it — the model
snapshot is out of sync; fix the model definition instead.

### 6.5 Module Link — the correct way to "extend" a core entity

Use this instead of ever touching the `product`, `order`, or `customer` tables.

`src/links/<kebab-name>-product.ts`
```ts
import <PascalName>Module from "../modules/<kebab-name>"
import ProductModule from "@medusajs/medusa/product"
import { defineLink } from "@medusajs/framework/utils"

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true, // omit for a one-to-one relationship
  },
  <PascalName>Module.linkable.<camelModel>
)
```
Run `npx medusa db:sync-links` (or `db:migrate`) after adding or changing a link.

Reading linked data (in a route, workflow step, or subscriber):
```ts
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const query = container.resolve(ContainerRegistrationKeys.QUERY)
const { data } = await query.graph({
  entity: "product",
  fields: ["id", "title", "<kebab-name>.*"],
  filters: { id: productId },
})
```

### 6.6 Workflow — steps + orchestration + rollback

`src/workflows/<kebab-name>/steps/create-<kebab-thing>.ts`
```ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { <SCREAMING_NAME>_MODULE } from "../../../modules/<kebab-name>"
import <PascalName>ModuleService from "../../../modules/<kebab-name>/service"

type Input = { title: string; product_id: string }

export const create<PascalThing>Step = createStep(
  "create-<kebab-thing>-step",
  async (input: Input, { container }) => {
    const service: <PascalName>ModuleService = container.resolve(<SCREAMING_NAME>_MODULE)
    const created = await service.create<PascalModel>s(input)
    // second argument is what the compensation function receives
    return new StepResponse(created, created.id)
  },
  async (createdId: string, { container }) => {
    const service: <PascalName>ModuleService = container.resolve(<SCREAMING_NAME>_MODULE)
    await service.delete<PascalModel>s(createdId)
  }
)
```

`src/workflows/<kebab-name>/index.ts`
```ts
import { createWorkflow, WorkflowResponse, WorkflowData } from "@medusajs/framework/workflows-sdk"
import { create<PascalThing>Step } from "./steps/create-<kebab-thing>"

export type Create<PascalThing>WorkflowInput = {
  title: string
  product_id: string
}

export const create<PascalThing>Workflow = createWorkflow(
  "create-<kebab-thing>",
  (input: WorkflowData<Create<PascalThing>WorkflowInput>) => {
    const result = create<PascalThing>Step(input)
    return new WorkflowResponse(result)
  }
)
```

**6.6b — Hooking into a core workflow (instead of editing it):**
```ts
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { StepResponse } from "@medusajs/framework/workflows-sdk"

createProductsWorkflow.hooks.productsCreated(
  async ({ products, additional_data }, { container }) => {
    // run your side-effect here, after core product creation
    return new StepResponse([], [])
  }
)
```
This is the correct way to react to or extend a built-in operation without ever
opening a core file.

### 6.7 Validators (Zod)

`src/api/admin/<kebab-path>/validators.ts`
```ts
import { z } from "zod"

export const PostAdmin<PascalThing> = z.object({
  title: z.string().min(1),
  product_id: z.string(),
})
export type PostAdmin<PascalThing>Type = z.infer<typeof PostAdmin<PascalThing>>
```

### 6.8 API Route

`src/api/admin/<kebab-path>/route.ts`
```ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { create<PascalThing>Workflow } from "../../../workflows/<kebab-name>"
import type { PostAdmin<PascalThing>Type } from "./validators"

export async function POST(
  req: MedusaRequest<PostAdmin<PascalThing>Type>,
  res: MedusaResponse
) {
  const { result } = await create<PascalThing>Workflow(req.scope).run({
    input: req.validatedBody,
  })
  res.json({ <camelThing>: result })
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")
  const { data } = await query.graph({
    entity: "<snake_model>",
    fields: ["*"],
    filters: req.validatedQuery,
  })
  res.json({ <camel_things>: data })
}
```
For Small features with no rollback risk, skip the workflow and call the module
service directly via `req.scope.resolve(<SCREAMING_NAME>_MODULE)` instead — do not
add a workflow just to satisfy this template.

### 6.9 Middleware Registration (validation wiring)

`src/api/middlewares.ts` — one file, one export, append to the `routes` array:
```ts
import { defineMiddlewares, validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework/http"
import { PostAdmin<PascalThing> } from "./admin/<kebab-path>/validators"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/<kebab-path>",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdmin<PascalThing>)],
    },
  ],
})
```
If this file already exists, **add your route object to the existing array** — do
not create a second `middlewares.ts`.

### 6.10 Subscriber

`src/subscribers/<event-name-with-dashes>.ts`
```ts
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { create<PascalThing>Workflow } from "../workflows/<kebab-name>"

export default async function <camelEvent>Handler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await create<PascalThing>Workflow(container).run({
    input: { product_id: data.id, title: "auto-generated" },
  })
}

export const config: SubscriberConfig = {
  event: "product.created", // exact core or custom event name
}
```

### 6.11 Admin Page (new sidebar route)

`src/admin/routes/<kebab-name>/page.tsx`
```tsx
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading } from "@medusajs/ui"

const <PascalName>Page = () => {
  return (
    <Container>
      <Heading level="h1"><Display Name></Heading>
      {/* reuse existing table/card/form components from src/admin/components */}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "<Display Name>",
})

export default <PascalName>Page
```

### 6.12 Admin Widget (inject into an existing page)

`src/admin/widgets/<kebab-name>-widget.tsx`
```tsx
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading } from "@medusajs/ui"
import type { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types"

const <PascalName>Widget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  return (
    <Container>
      <Heading level="h2"><Widget Title></Heading>
      {/* fetch via a hook in src/admin/hooks/api, mirror an existing hook file */}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after", // pick the correct zone for the target page
})

export default <PascalName>Widget
```

---

## 7. Wrong vs Right

**Business logic location**
```
// WRONG — inside the route
export async function POST(req, res) {
  const rows = await db.query("SELECT ...")
  if (rows.length > 10) { /* business rule inline */ }
  res.json(rows)
}

// RIGHT — route calls service, service holds the rule
export async function POST(req, res) {
  const service = req.scope.resolve(MY_MODULE)
  const result = await service.applyDiscountRule(req.validatedBody)
  res.json(result)
}
```

**Extending a core entity**
```
// WRONG — migration that ALTERs the core `product` table
ALTER TABLE product ADD COLUMN vendor_id text;

// RIGHT — new module + module link
src/modules/vendor/models/vendor.ts   (new table)
src/links/vendor-product.ts           (defineLink)
```

**Multi-step operation without rollback**
```
// WRONG — service method does two things, no undo if #2 fails
async createOrderAndCharge(input) {
  const order = await this.createOrders(input)
  await paymentProvider.charge(order)   // if this throws, the order is orphaned
  return order
}

// RIGHT — two steps in a workflow, each with compensation
createOrderStep      (compensation: delete the order)
chargePaymentStep    (compensation: refund the charge)
```

**Skipping validation**
```
// WRONG
export async function POST(req, res) {
  const { title } = req.body // untyped, unvalidated
}

// RIGHT
// validators.ts defines a Zod schema, middlewares.ts wires it in,
// the route reads req.validatedBody, which is typed and guaranteed valid.
```

**Reinventing an existing pattern**
```
// WRONG — a new custom fetch wrapper for the Admin UI when one already exists
const res = await fetch("/admin/things"); const data = await res.json()

// RIGHT — mirror the existing hook pattern in src/admin/hooks/api/*
export const useThings = () => useQuery(["things"], () => fetchThings())
```

---

## 8. Testing & Verification Checklist

1. Get an admin bearer token:
```bash
curl -X POST http://localhost:9000/auth/user/emailpass \
  -H "Content-Type: application/json" \
  -d '{ "email": "admin@example.com", "password": "supersecret" }'
```
2. Call your endpoint with the token:
```bash
curl -X POST http://localhost:9000/admin/<kebab-path> \
  -H "Authorization: Bearer <token_from_step_1>" \
  -H "Content-Type: application/json" \
  -d '{ "title": "test", "product_id": "prod_123" }'
```
3. Confirm the row exists (via the module service, a quick script, or `psql`).
4. Send an intentionally invalid body and confirm the Zod middleware rejects it
   with a 400, not a 500.
5. If a workflow is involved, force a failure in the second step and confirm the
   first step's compensation actually ran (check that its side effect was undone).
6. If a module link is involved, confirm `query.graph` returns the joined field.

---

## 9. Final Quality Gate

Before calling a feature done, confirm every line:

- [ ] Did I inspect the existing project structure first (Step 0), and did I mirror
      an existing similar pattern rather than invent a new one?
- [ ] Correct size classification — no workflow bolted onto a Small feature, no
      Medium feature missing its workflow/rollback?
- [ ] Correct API zone — `/admin` for dashboard-only, `/store` for storefront?
- [ ] Does it need auth — and is auth actually enforced (admin routes are protected
      by default; don't disable it)?
- [ ] Is there a migration, did it generate cleanly, did `db:migrate` run
      successfully, and does the diff touch only this module's tables?
- [ ] Is input validated with Zod and wired into `middlewares.ts`?
- [ ] Is any core entity extended via a module + link, never a direct schema edit?
- [ ] Is any core behavior extended via a workflow hook, never a core file edit?
- [ ] Does the Admin UI (if any) reuse existing components/hooks/styling?
- [ ] Did I actually call the endpoint once (Section 8), not just read the code?

If every box is checked, the feature should be indistinguishable from code the
original project authors wrote themselves.

---

## 10. When the real project structure arrives

This document ships with generic placeholders (`<kebab-name>`, `<PascalModel>`,
example module names like `vendor`/`blog`/`availability`). Once the actual project
tree is provided:

1. Replace the module/route examples in Section 3 with the project's real module
   names and existing route paths.
2. Check whether `src/api/middlewares.ts` already exists — if so, all new
   validators get **added to** its `routes` array, not placed in a new file.
3. Check `src/admin/hooks/api/` and `src/admin/components/` for existing patterns
   before writing anything from the templates in 6.11/6.12.
4. Check `medusa-config.ts` for modules already registered, so new entries are
   appended rather than duplicated.

Everything else in this manual (the algorithm, the templates, the rules) stays the
same regardless of the specific project.