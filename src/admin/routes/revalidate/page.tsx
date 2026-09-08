import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, toast } from "@medusajs/ui"
import { RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { useState } from "react"

interface RevalidateResult {
  tag: string
  success: boolean
  error?: string
}

interface RevalidateResponse {
  message: string
  results: RevalidateResult[]
}

const RevalidatePage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<RevalidateResult[] | null>(null)

  const handleRevalidate = async () => {
    setIsLoading(true)
    setResults(null)

    try {
      const response = await fetch("/admin/revalidate", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText)
      }

      const data: RevalidateResponse = await response.json()
      setResults(data.results)

      const failed = data.results.filter((r) => !r.success).length
      if (failed === 0) {
        toast.success("All pages re-rendered successfully")
      } else {
        toast.error(`${failed} tag(s) failed to revalidate`)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to revalidate pages"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container className="flex flex-col gap-6 items-start max-w-2xl">
      <div className="flex flex-col gap-2">
        <Heading level="h1">Re-render Storefront Pages</Heading>
        <Text className="text-ui-fg-subtle">
          Click the button below to instantly re-render all cached storefront
          pages. This will fetch the latest content for products, packages,
          banners, portfolio, testimonials, collections, and regions.
        </Text>
      </div>

      <Button
        size="large"
        variant="primary"
        onClick={handleRevalidate}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <RefreshCw
          className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
        />
        {isLoading ? "Re-rendering..." : "Re-render All Pages"}
      </Button>

      {results && (
        <div className="flex flex-col gap-3 w-full">
          <Heading level="h3">Results</Heading>
          <div className="flex flex-col gap-2">
            {results.map((result) => (
              <div
                key={result.tag}
                className="flex items-center justify-between p-3 border border-ui-border-base rounded-lg bg-ui-bg-subtle"
              >
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-ui-fg-positive" />
                  ) : (
                    <XCircle className="w-5 h-5 text-ui-fg-error" />
                  )}
                  <Text className="font-medium capitalize">{result.tag}</Text>
                </div>
                <Text
                  className={
                    result.success
                      ? "text-ui-fg-positive"
                      : "text-ui-fg-error"
                  }
                >
                  {result.success
                    ? "Success"
                    : result.error || "Failed"}
                </Text>
              </div>
            ))}
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Re-render Pages",
})

export default RevalidatePage
