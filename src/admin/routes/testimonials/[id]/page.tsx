import { Container, Heading, Input, Textarea, Text, Button, Checkbox, Label, toast } from "@medusajs/ui"
import {
  useTestimonial,
  useUpdateTestimonial,
  useDeleteTestimonial,
} from "../../../hooks/api/testimonials"
import { uploadFile } from "../../../lib/upload"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { Trash } from "@medusajs/icons"

const TestimonialDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useTestimonial(id ?? "")
  const updateTestimonial = useUpdateTestimonial(id ?? "")
  const deleteTestimonial = useDeleteTestimonial()

  const [nameEn, setNameEn] = useState("")
  const [nameAr, setNameAr] = useState("")
  const [quoteEn, setQuoteEn] = useState("")
  const [quoteAr, setQuoteAr] = useState("")
  const [positionEn, setPositionEn] = useState("")
  const [positionAr, setPositionAr] = useState("")
  const [displayOrder, setDisplayOrder] = useState(0)
  const [isPublished, setIsPublished] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (data?.testimonial) {
      const t = data.testimonial
      setNameEn(t.name_en)
      setNameAr(t.name_ar)
      setQuoteEn(t.quote_en)
      setQuoteAr(t.quote_ar)
      setPositionEn(t.position_en)
      setPositionAr(t.position_ar)
      setDisplayOrder(t.display_order)
      setIsPublished(t.is_published)
      setImageUrl(t.image_url)
    }
  }, [data])

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
      await updateTestimonial.mutateAsync({
        name_en: nameEn,
        name_ar: nameAr,
        image_url: imageUrl,
        quote_en: quoteEn,
        quote_ar: quoteAr,
        position_en: positionEn,
        position_ar: positionAr,
        display_order: displayOrder,
        is_published: isPublished,
      })
      toast.success("Testimonial updated")
    } catch (e) {
      toast.error("Failed to update testimonial")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this testimonial?")) return
    try {
      await deleteTestimonial.mutateAsync(id!)
      toast.success("Testimonial deleted")
      navigate("/testimonials")
    } catch (e) {
      toast.error("Failed to delete testimonial")
    }
  }

  if (isLoading) {
    return <Container><Heading level="h1">Loading...</Heading></Container>
  }

  if (error || !data?.testimonial) {
    return <Container><Heading level="h1">Testimonial not found</Heading></Container>
  }

  return (
    <Container>
      <div className="flex items-center justify-between">
        <Heading level="h1">{data.testimonial.name_en}</Heading>
        <div className="flex gap-2">
          <Button variant="secondary" size="small" onClick={() => navigate("/testimonials")}>
            Back
          </Button>
          <Button variant="danger" size="small" onClick={handleDelete}>
            <Trash /> Delete
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text size="small" weight="plus" className="mb-1">Name (English)</Text>
            <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          </div>
          <div>
            <Text size="small" weight="plus" className="mb-1">Name (Arabic)</Text>
            <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text size="small" weight="plus" className="mb-1">Position (English)</Text>
            <Input value={positionEn} onChange={(e) => setPositionEn(e.target.value)} />
          </div>
          <div>
            <Text size="small" weight="plus" className="mb-1">Position (Arabic)</Text>
            <Input value={positionAr} onChange={(e) => setPositionAr(e.target.value)} dir="rtl" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text size="small" weight="plus" className="mb-1">Quote (English)</Text>
            <Textarea value={quoteEn} onChange={(e) => setQuoteEn(e.target.value)} />
          </div>
          <div>
            <Text size="small" weight="plus" className="mb-1">Quote (Arabic)</Text>
            <Textarea value={quoteAr} onChange={(e) => setQuoteAr(e.target.value)} dir="rtl" />
          </div>
        </div>

        <div>
          <Text size="small" weight="plus" className="mb-1">Client Image (optional)</Text>
          <div className="flex items-center gap-4">
            {imageUrl && (
              <img src={imageUrl} alt="Client" className="h-20 w-20 rounded-full border object-cover" />
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

        <div>
          <Button onClick={handleSave} isLoading={updateTestimonial.isPending}>
            Save Changes
          </Button>
        </div>
      </div>
    </Container>
  )
}

export default TestimonialDetailPage
