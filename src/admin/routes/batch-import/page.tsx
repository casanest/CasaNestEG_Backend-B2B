import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, toast, Label } from "@medusajs/ui"
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useState, useRef } from "react"

interface ImportResult {
  created_count: number
  skipped_count: number
  skipped_handles: string[]
  products: any[]
}

const BatchImportPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file")
      return
    }

    setSelectedFile(file)
    setResult(null)
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a CSV file first")
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/admin/products/batch-import", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Import failed (${response.status})`

        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.message || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }

        throw new Error(errorMessage)
      }

      const data: ImportResult = await response.json()
      setResult(data)

      if (data.created_count > 0 && data.skipped_count === 0) {
        toast.success(`Successfully imported ${data.created_count} product(s)`)
      } else if (data.created_count > 0 && data.skipped_count > 0) {
        toast.success(
          `Imported ${data.created_count} product(s), skipped ${data.skipped_count} existing handle(s)`
        )
      } else if (data.created_count === 0 && data.skipped_count > 0) {
        toast.error(`All ${data.skipped_count} product(s) already exist — nothing imported`)
      } else {
        toast.error("No products were imported")
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to import products"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Container className="flex flex-col gap-6 items-start max-w-3xl">
      <div className="flex flex-col gap-2">
        <Heading level="h1">Batch Import Products</Heading>
        <Text className="text-ui-fg-subtle">
          Upload a CSV file to batch-create products with variants, options,
          categories, Arabic metadata, and custom fields (show price, homepage,
          MOQ). Products with existing handles will be skipped.
        </Text>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Label htmlFor="csv-file">CSV File</Label>

        <input
          ref={fileInputRef}
          id="csv-file"
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isLoading}
        />

        {selectedFile ? (
          <div className="flex items-center gap-2 p-3 border border-ui-border-base rounded-lg bg-ui-bg-subtle">
            <FileText className="w-5 h-5 text-ui-fg-subtle flex-shrink-0" />
            <span className="text-sm truncate flex-1">{selectedFile.name}</span>
            <span className="text-xs text-ui-fg-subtle">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </span>
            <Button
              variant="danger"
              size="small"
              onClick={handleReset}
              disabled={isLoading}
            >
              Remove
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="small"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Select CSV File
          </Button>
        )}
      </div>

      <Button
        size="large"
        variant="primary"
        onClick={handleImport}
        disabled={!selectedFile || isLoading}
        className="flex items-center gap-2"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Upload className="w-5 h-5" />
        )}
        {isLoading ? "Importing..." : "Import Products"}
      </Button>

      {result && (
        <div className="flex flex-col gap-4 w-full">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 border border-ui-border-base rounded-lg bg-ui-bg-subtle">
              <CheckCircle className="w-6 h-6 text-ui-fg-positive" />
              <div className="flex flex-col">
                <Text className="text-2xl font-bold">{result.created_count}</Text>
                <Text className="text-ui-fg-subtle text-sm">Created</Text>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border border-ui-border-base rounded-lg bg-ui-bg-subtle">
              <XCircle className="w-6 h-6 text-ui-fg-error" />
              <div className="flex flex-col">
                <Text className="text-2xl font-bold">{result.skipped_count}</Text>
                <Text className="text-ui-fg-subtle text-sm">Skipped (existing)</Text>
              </div>
            </div>
          </div>

          {result.skipped_handles.length > 0 && (
            <div className="flex flex-col gap-2">
              <Text className="font-medium">Skipped Handles:</Text>
              <div className="flex flex-wrap gap-2">
                {result.skipped_handles.map((handle) => (
                  <span
                    key={handle}
                    className="px-2 py-1 text-xs bg-ui-bg-base border border-ui-border-base rounded-md text-ui-fg-subtle"
                  >
                    {handle}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.products.length > 0 && (
            <div className="flex flex-col gap-2">
              <Text className="font-medium">Created Products:</Text>
              <div className="flex flex-col gap-1">
                {result.products.map((product: any) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-2 border border-ui-border-base rounded-md"
                  >
                    <Text className="text-sm">{product.title}</Text>
                    <Text className="text-xs text-ui-fg-subtle font-mono">
                      {product.handle}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Batch Import",
})

export default BatchImportPage
