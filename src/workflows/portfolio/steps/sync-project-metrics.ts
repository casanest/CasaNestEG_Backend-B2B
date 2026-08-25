import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PORTFOLIO_MODULE } from "../../../modules/portfolio"
import PortfolioModuleService from "../../../modules/portfolio/service"

type MetricInput = {
  id?: string
  label_en: string
  label_ar: string
  value_en: string
  value_ar: string
  display_order: number
}

type SyncProjectMetricsStepInput = {
  project_id: string
  metrics: MetricInput[]
}

export const syncProjectMetricsStep = createStep(
  "sync-project-metrics-step",
  async (input: SyncProjectMetricsStepInput, { container }) => {
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)

    const existing = await portfolioModule.listProjectMetrics({
      project_id: input.project_id,
    })

    const existingIds = existing.map((e: any) => e.id)
    const inputIds = input.metrics.filter((m) => m.id).map((m) => m.id!)

    const toDelete = existingIds.filter((id: string) => !inputIds.includes(id))

    if (toDelete.length > 0) {
      await portfolioModule.deleteProjectMetrics(toDelete)
    }

    const created: any[] = []
    const updated: any[] = []

    for (const metric of input.metrics) {
      if (metric.id) {
        const result = await portfolioModule.updateProjectMetrics({
          id: metric.id,
          label_en: metric.label_en,
          label_ar: metric.label_ar,
          value_en: metric.value_en,
          value_ar: metric.value_ar,
          display_order: metric.display_order,
        })
        updated.push(result)
      } else {
        const result = await portfolioModule.createProjectMetrics({
          project_id: input.project_id,
          label_en: metric.label_en,
          label_ar: metric.label_ar,
          value_en: metric.value_en,
          value_ar: metric.value_ar,
          display_order: metric.display_order,
        })
        created.push(result)
      }
    }

    return new StepResponse(
      { created, updated },
      { existing, toDelete }
    )
  },
  async (compensationData: { existing: any[]; toDelete: string[] }, { container }) => {
    if (!compensationData) return
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)

    for (const metric of compensationData.existing) {
      await portfolioModule.updateProjectMetrics({
        id: metric.id,
        label_en: metric.label_en,
        label_ar: metric.label_ar,
        value_en: metric.value_en,
        value_ar: metric.value_ar,
        display_order: metric.display_order,
      })
    }
  }
)
