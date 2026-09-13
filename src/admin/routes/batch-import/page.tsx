import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, toast, Label } from "@medusajs/ui"
import { Upload, FileText, CheckCircle, XCircle, Loader2, Download } from "lucide-react"
import { useState, useRef } from "react"

interface ImportResult {
  created_count: number
  skipped_count: number
  skipped_handles: string[]
  skipped_category_count: number
  skipped_category_handles: { handle: string; unmatched_category_path: string }[]
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

      const categorySkipped = data.skipped_category_count || 0
      if (data.created_count > 0 && data.skipped_count === 0 && categorySkipped === 0) {
        toast.success(`Successfully imported ${data.created_count} product(s)`)
      } else if (data.created_count > 0) {
        toast.success(
          `Imported ${data.created_count} product(s), skipped ${data.skipped_count} existing, ${categorySkipped} unmatched category`
        )
      } else if (data.created_count === 0 && (data.skipped_count > 0 || categorySkipped > 0)) {
        toast.error(`No products imported — ${data.skipped_count} existing, ${categorySkipped} unmatched category`)
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

  const handleDownloadTemplate = () => {
    const headers = [
      "product_handle",
      "product_title",
      "product_description",
      "ar_title",
      "ar_description",
      "ar_meta_keywords",
      "variant_sku",
      "variant_title",
      "price_egp",
      "variant_height",
      "variant_width",
      "variant_length",
      "variant_weight",
      "category_handles",
      "option_1_name",
      "option_1_value",
      "option_2_name",
      "option_2_value",
      "product_show_price",
      "product_show_on_homepage",
      "product_moq",
      "price_after",
    ]

    const sampleDescription = [
      "• Main material: Swedish wood",
      "• Main material for legs: Beech wood",
      "• Upholstery material: Sponge",
      "• Upholstery density: 28",
      "• Fabric type: Leather",
      "• Primary color: Green",
      "• Primary color for legs: Brown",
      "• Number of main pieces: 3",
      "",
      "Sofa dimensions:",
      "• Width: 180 cm",
      "• Height: 80 cm",
      "• Depth: 70 cm",
      "• Base depth: 55 cm",
      "• Armrest height: 60 cm",
      "",
      "Chair dimensions:",
      "• Width: 70 cm",
      "• Height: 70 cm",
      "• Depth: 70 cm",
      "• Chair base depth: 55 cm",
      "• Chair seat height: 45 cm",
      "",
      "• Available in a variety of colors to suit all tastes.",
      "• Delivery time: 10 business days.",
    ].join("\n")

    const sampleArDescription = [
      "• الخامة الرئيسية: خشب سويدي",
      "• الخامة الرئيسية للرجل: خشب زان",
      "• خامة التنجيد: إسفنج",
      "• كثافة خامة التنجيد: 28",
      "• نوع القماش: جلد",
      "• اللون الرئيسي: أخضر",
      "• اللون الرئيسي للرجل: بني",
      "• عدد القطع الرئيسية: 3",
      "",
      "أبعاد الكنبة:",
      "• العرض: 180 سم",
      "• الارتفاع: 80 سم",
      "• العمق: 70 سم",
      "• عمق القاعدة: 55 سم",
      "• ارتفاع مسند الذراع: 60 سم",
      "",
      "أبعاد الكرسي:",
      "• العرض: 70 سم",
      "• الارتفاع: 70 سم",
      "• العمق: 70 سم",
      "• عمق قاعدة الكرسي: 55 سم",
      "• ارتفاع مقعد الكرسي: 45 سم",
      "",
      "• متوفر بمجموعة متنوعة من الألوان لتناسب جميع الأذواق.",
      "• مدة التوصيل: 10 أيام عمل.",
    ].join("\n")

    const escapeCsv = (val: string) => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return '"' + val.replace(/"/g, '""') + '"'
      }
      return val
    }

    const row1 = [
      "sample-sofa-set",
      "Sample Sofa Set",
      sampleDescription,
      "كنبة عينة",
      sampleArDescription,
      "كنبة, أريكة, صالون",
      "SOFA-001",
      "3-Seater Sofa",
      "15000",
      "80",
      "180",
      "70",
      "45",
      "Furniture > Living Room > Sofas",
      "Color",
      "Green",
      "",
      "",
      "TRUE",
      "TRUE",
      "1",
      "12000",
    ]

    const row2 = [
      "sample-sofa-set",
      "Sample Sofa Set",
      "",
      "",
      "",
      "",
      "SOFA-002",
      "Armchair",
      "8000",
      "70",
      "70",
      "70",
      "20",
      "",
      "Color",
      "Brown",
      "",
      "",
      "",
      "",
      "",
      "",
    ]

    const csvLines = [
      headers.join(","),
      row1.map(escapeCsv).join(","),
      row2.map(escapeCsv).join(","),
    ]

    const csvContent = csvLines.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "batch-import-template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("CSV template downloaded")
  }

  return (
    <Container className="flex flex-col gap-6 items-start max-w-3xl">
      <div className="flex flex-col gap-2">
        <Heading level="h1">Batch Import Products</Heading>
        <Text className="text-ui-fg-subtle">
          Upload a CSV file to batch-create products with variants, options,
          categories, Arabic metadata, custom fields (show price, homepage,
          MOQ), and discount prices. Products with existing handles will be
          skipped. Categories must be entered as full tree paths using {">"} as
          the hierarchy separator (e.g. "Electrical Appliances {">"} Refrigerators {">"}
          Minibar"). Multiple category paths are separated by commas. Products
          with unmatched category paths will be skipped.
        </Text>
        <Text className="text-ui-fg-subtle text-sm">
          Multi-line descriptions are supported in both
          <code className="px-1 mx-1 bg-ui-bg-base rounded">product_description</code>
          (English) and
          <code className="px-1 mx-1 bg-ui-bg-base rounded">ar_description</code>
          (Arabic). Wrap multi-line values in double quotes in the CSV — newlines
          inside quotes are preserved.
        </Text>
      </div>

      <Button
        variant="secondary"
        size="small"
        onClick={handleDownloadTemplate}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Download CSV Template
      </Button>

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

          {result.skipped_category_handles && result.skipped_category_handles.length > 0 && (
            <div className="flex flex-col gap-2">
              <Text className="font-medium">Skipped (Unmatched Categories):</Text>
              <div className="flex flex-col gap-1">
                {result.skipped_category_handles.map((item) => (
                  <div
                    key={item.handle}
                    className="flex items-center justify-between p-2 border border-ui-border-base rounded-md"
                  >
                    <Text className="text-sm">{item.handle}</Text>
                    <Text className="text-xs text-ui-fg-subtle">
                      Unmatched: {item.unmatched_category_path}
                    </Text>
                  </div>
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
