import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Label, Input, Button, Switch, toast } from "@medusajs/ui"
import { Save, Upload, Trash, FileText, ExternalLink } from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"

const ProductCustomFieldsWidget = ({
  data,
}: DetailWidgetProps<AdminProduct>) => {
  const [moq, setMoq] = useState<number>(1)
  const [documentUrl, setDocumentUrl] = useState<string>("")
  const [isInHomepage, setIsInHomepage] = useState<boolean>(false)
  const [showPrice, setShowPrice] = useState<boolean>(false)
  const [showDocument, setShowDocument] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadCustomFields = useCallback(async () => {
    try {
      const response = await fetch(`/admin/products/${data.id}/custom`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to load custom fields")
      }

      const result = await response.json()

      setMoq(result.product_custom?.moq ?? 1)
      setDocumentUrl(result.product_custom?.document_url ?? "")
      setIsInHomepage(result.product_custom?.is_in_homepage ?? false)
      setShowPrice(result.product_custom?.show_price ?? false)
      setShowDocument(result.product_custom?.show_document ?? false)
    } catch (error) {
      console.error("Error loading custom fields:", error)
    } finally {
      setIsLoading(false)
    }
  }, [data.id])

  useEffect(() => {
    loadCustomFields()
  }, [loadCustomFields])

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("files", file)

    const response = await fetch("/admin/uploads", {
      method: "POST",
      body: formData,
      credentials: "include",
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Upload failed: ${response.status} ${errorText}`)
    }

    const result = await response.json()

    const uploadedFiles = result.uploads ?? result.files ?? [result]
    if (!uploadedFiles || uploadedFiles.length === 0) {
      throw new Error("No file was uploaded successfully")
    }

    const uploadedFile = uploadedFiles[0]
    const url = uploadedFile.url ?? uploadedFile.key ?? uploadedFile.location

    if (!url) {
      throw new Error(
        `Upload response missing URL field. Available: ${Object.keys(uploadedFile).join(", ")}`
      )
    }

    return url
  }, [])

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const url = await uploadFile(file)
      setDocumentUrl(url)
      toast.success("Success", {
        description: "Document uploaded. Click Save to persist.",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error uploading document:", error)
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Failed to upload document",
        duration: 5000,
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveDocument = () => {
    setDocumentUrl("")
    toast.success("Success", {
      description: "Document removed. Click Save to persist.",
      duration: 3000,
    })
  }

  const handleToggleHomepage = useCallback(async (newValue: boolean) => {
    setIsInHomepage(newValue)
    try {
      const response = await fetch(`/admin/products/${data.id}/custom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          moq,
          document_url: documentUrl || null,
          is_in_homepage: newValue,
          show_price: showPrice,
          show_document: showDocument,
        }),
      })

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`)
      }

      const result = await response.json()
      setIsInHomepage(result.product_custom?.is_in_homepage ?? newValue)
      setShowPrice(result.product_custom?.show_price ?? showPrice)
      setShowDocument(result.product_custom?.show_document ?? showDocument)

      toast.success(`Product ${newValue ? "added to" : "removed from"} homepage`)
    } catch (error) {
      console.error("Error toggling homepage:", error)
      toast.error("Failed to update homepage status")
      setIsInHomepage(!newValue)
    }
  }, [data.id, moq, documentUrl, showPrice, showDocument])

  const handleToggleShowPrice = useCallback(async (newValue: boolean) => {
    setShowPrice(newValue)
    try {
      const response = await fetch(`/admin/products/${data.id}/custom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          moq,
          document_url: documentUrl || null,
          is_in_homepage: isInHomepage,
          show_price: newValue,
          show_document: showDocument,
        }),
      })

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`)
      }

      const result = await response.json()
      setShowPrice(result.product_custom?.show_price ?? newValue)
      setIsInHomepage(result.product_custom?.is_in_homepage ?? isInHomepage)
      setShowDocument(result.product_custom?.show_document ?? showDocument)

      toast.success(`Price ${newValue ? "shown to" : "hidden from"} customers`)
    } catch (error) {
      console.error("Error toggling show_price:", error)
      toast.error("Failed to update price visibility")
      setShowPrice(!newValue)
    }
  }, [data.id, moq, documentUrl, isInHomepage, showDocument])

  const handleToggleShowDocument = useCallback(async (newValue: boolean) => {
    setShowDocument(newValue)
    try {
      const response = await fetch(`/admin/products/${data.id}/custom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          moq,
          document_url: documentUrl || null,
          is_in_homepage: isInHomepage,
          show_price: showPrice,
          show_document: newValue,
        }),
      })

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`)
      }

      const result = await response.json()
      setShowDocument(result.product_custom?.show_document ?? newValue)
      setShowPrice(result.product_custom?.show_price ?? showPrice)
      setIsInHomepage(result.product_custom?.is_in_homepage ?? isInHomepage)

      toast.success(`Document ${newValue ? "shown to" : "hidden from"} customers`)
    } catch (error) {
      console.error("Error toggling show_document:", error)
      toast.error("Failed to update document visibility")
      setShowDocument(!newValue)
    }
  }, [data.id, moq, documentUrl, isInHomepage, showPrice])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/admin/products/${data.id}/custom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          moq,
          document_url: documentUrl || null,
          is_in_homepage: isInHomepage,
          show_price: showPrice,
          show_document: showDocument,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Save failed: ${response.status} ${errorText}`)
      }

      const result = await response.json()

      setMoq(result.product_custom?.moq ?? moq)
      setDocumentUrl(result.product_custom?.document_url ?? "")
      setIsInHomepage(result.product_custom?.is_in_homepage ?? false)
      setShowPrice(result.product_custom?.show_price ?? false)
      setShowDocument(result.product_custom?.show_document ?? false)

      toast.success("Success", {
        description: "Custom fields saved successfully",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error saving custom fields:", error)
      toast.error("Error", {
        description: "Failed to save custom fields",
        duration: 5000,
      })
    } finally {
      setIsSaving(false)
    }
  }, [data.id, moq, documentUrl, isInHomepage, showPrice, showDocument])

  if (isLoading) {
    return (
      <Container className="p-4">
        <Heading level="h2">Product Custom Fields</Heading>
        <p className="text-ui-fg-subtle mt-2">Loading...</p>
      </Container>
    )
  }

  return (
    <Container className="p-4">
      <Heading level="h2">Product Custom Fields</Heading>

      <div className="flex flex-col gap-4 mt-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="moq">Minimum Order Quantity (MOQ)</Label>
          <Input
            id="moq"
            type="number"
            min={1}
            value={moq}
            onChange={(e) => setMoq(parseInt(e.target.value) || 1)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="document_url">Document URL</Label>

          {documentUrl ? (
            <div className="flex items-center gap-2 p-3 border rounded-md bg-ui-bg-subtle">
              <FileText className="w-5 h-5 text-ui-fg-subtle flex-shrink-0" />
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ui-fg-info text-sm underline truncate flex-1"
              >
                {documentUrl.split("/").pop() || documentUrl}
              </a>
              <ExternalLink className="w-4 h-4 text-ui-fg-subtle flex-shrink-0" />
              <Button
                variant="danger"
                size="small"
                onClick={handleRemoveDocument}
                disabled={isSaving || isUploading}
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <p className="text-ui-fg-subtle text-sm">
              No document uploaded yet.
            </p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading || isSaving}
          />

          <Button
            variant="secondary"
            size="small"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isSaving}
            isLoading={isUploading}
          >
            {!isUploading && <Upload className="w-4 h-4 mr-2" />}
            {isUploading ? "Uploading..." : "Upload Document"}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="is_in_homepage"
            checked={isInHomepage}
            onCheckedChange={(val) => handleToggleHomepage(val as boolean)}
          />
          <Label htmlFor="is_in_homepage" size="small">
            Show on homepage
          </Label>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="show_price"
            checked={showPrice}
            onCheckedChange={(val) => handleToggleShowPrice(val as boolean)}
          />
          <Label htmlFor="show_price" size="small">
            Show price to customer
          </Label>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="show_document"
            checked={showDocument}
            onCheckedChange={(val) => handleToggleShowDocument(val as boolean)}
          />
          <Label htmlFor="show_document" size="small">
            Show document to user
          </Label>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isSaving || isUploading}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductCustomFieldsWidget
