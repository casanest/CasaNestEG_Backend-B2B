import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PORTFOLIO_MODULE } from "../../../modules/portfolio"
import PortfolioModuleService from "../../../modules/portfolio/service"

type MetricInput = {
  label_en: string
  label_ar: string
  value_en: string
  value_ar: string
  display_order: number
}

type CreateProjectMetricsStepInput = {
  project_id: string
  metrics: MetricInput[]
}

export const createProjectMetricsStep = createStep(
  "create-project-metrics-step",
  async (input: CreateProjectMetricsStepInput, { container }) => {
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)

    if (!input.metrics || input.metrics.length === 0) {
      return new StepResponse([], [])
    }

    const records: any = await portfolioModule.createProjectMetrics(
      input.metrics.map((m) => ({
        ...m,
        project_id: input.project_id,
      }))
    )

    const ids: string[] = Array.isArray(records) ? records.map((r: any) => r.id) : [records.id]

    return new StepResponse(records, ids)
  },
  async (ids: string[], { container }) => {
    if (!ids || ids.length === 0) return
    const portfolioModule = container.resolve<
      InstanceType<typeof PortfolioModuleService>
    >(PORTFOLIO_MODULE)
    await portfolioModule.deleteProjectMetrics(ids)
  }
)
