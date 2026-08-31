import { Container, Heading, Input, Textarea, Text, Button, Checkbox, Label, Switch, toast } from "@medusajs/ui"
import { useCreateTestimonial } from "../../../hooks/api/testimonials"
import { uploadFile } from "../../../lib/upload"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

const CreateTestimonialPage = () => {
  const navigate = useNavigate()
  const createTestimonial = useCreateTestimonial()

  const [nameEn, setNameEn] = useState("")
  const [nameAr, setNameAr] = useState("")
  const [quoteEn, setQuoteEn] = useState("")
  const [quoteAr, setQuoteAr] = useState("")
  const [positionEn, setPositionEn] = useState("")
  const [positionAr, setPositionAr] = useState("")
  const [displayOrder, setDisplayOrder] = useState(0)
  const [isPublished, setIsPublished] = useState(false)
  const [isInHomepage, setIsInHomepage] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadFile(file)
      setImageUrl(url)
      toast.success("Image uploaded")
    } catch (e) {
      toast.error("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!nameEn || !nameAr || !quoteEn || !quoteAr || !positionEn || !positionAr) {
      toast.error("All fields except image are required")
      return
    }

    try {
      const result = await createTestimonial.mutateAsync({
        name_en: nameEn,
        name_ar: nameAr,
        image_url: imageUrl,
        quote_en: quoteEn,
        quote_ar: quoteAr,
        position_en: positionEn,
        position_ar: positionAr,
        display_order: displayOrder,
        is_published: isPublished,
        is_in_homepage: isInHomepage,
      })
      toast.success("Testimonial created")
      navigate(`/testimonials/${result.testimonial.id}`)
    } catch (e) {
      toast.error("Failed to create testimonial")
    }
  }

  return (
    <Container>
      <div className="flex items-center justify-between">
        <Heading level="h1">Create Testimonial</Heading>
        <Button variant="secondary" size="small" onClick={() => navigate("/testimonials")}>
          Back
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text size="small" weight="plus" className="mb-1">Name (English)</Text>
            <Input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div>
            <Text size="small" weight="plus" className="mb-1">Name (Arabic)</Text>
            <Input
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="جون دو"
              dir="rtl"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text size="small" weight="plus" className="mb-1">Position (English)</Text>
            <Input
              value={positionEn}
              onChange={(e) => setPositionEn(e.target.value)}
              placeholder="CEO, Acme Inc."
            />
          </div>
          <div>
            <Text size="small" weight="plus" className="mb-1">Position (Arabic)</Text>
            <Input
              value={positionAr}
              onChange={(e) => setPositionAr(e.target.value)}
              placeholder="الرئيس التنفيذي، شركة أكمي"
              dir="rtl"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text size="small" weight="plus" className="mb-1">Quote (English)</Text>
            <Textarea
              value={quoteEn}
              onChange={(e) => setQuoteEn(e.target.value)}
              placeholder="Excellent service and quality..."
            />
          </div>
          <div>
            <Text size="small" weight="plus" className="mb-1">Quote (Arabic)</Text>
            <Textarea
              value={quoteAr}
              onChange={(e) => setQuoteAr(e.target.value)}
              placeholder="خدمة ممتازة وجودة عالية..."
              dir="rtl"
            />
          </div>
        </div>

        <div>
          <Text size="small" weight="plus" className="mb-1">Client Image (optional)</Text>
          <div className="flex items-center gap-4">
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Client"
                className="h-20 w-20 rounded-full border object-cover"
              />
            )}
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                }}
                className="text-sm"
              />
              {uploading && <Text size="xsmall">Uploading...</Text>}
            </div>
          </div>
        </div>

        <div>
          <Text size="small" weight="plus" className="mb-1">Display Order</Text>
          <Input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
            placeholder="0"
          />
          <Text size="xsmall" className="mt-1 text-ui-fg-subtle">
            Lower numbers appear first.
          </Text>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="is_published"
            checked={isPublished}
            onCheckedChange={(val) => setIsPublished(val as boolean)}
          />
          <Label htmlFor="is_published" size="small">
            Published (visible on storefront)
          </Label>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="is_in_homepage"
            checked={isInHomepage}
            onCheckedChange={(val) => setIsInHomepage(val as boolean)}
          />
          <Label htmlFor="is_in_homepage" size="small">
            Show on homepage
          </Label>
        </div>

        <div className="mt-4">
          <Button
            onClick={handleSave}
            isLoading={createTestimonial.isPending}
          >
            Create Testimonial
          </Button>
        </div>
      </div>
    </Container>
  )
}

export default CreateTestimonialPage
