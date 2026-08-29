import { Container, Heading, Text, Button, Switch, Label, Select, toast } from "@medusajs/ui"
import {
  useBanner,
  useUpdateBanner,
  useDeleteBanner,
} from "../../../hooks/api/banners"
import { uploadFile } from "../../../lib/upload"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { Trash } from "@medusajs/icons"

const BannerDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useBanner(id ?? "")
  const updateBanner = useUpdateBanner(id ?? "")
  const deleteBanner = useDeleteBanner()

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [type, setType] = useState<"hero" | "past_customer" | "partners">("hero")
  const [isActive, setIsActive] = useState(false)
  const [displayOrder, setDisplayOrder] = useState(0)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (data?.banner) {
      const b = data.banner
      setImageUrl(b.image_url)
      setType(b.type)
      setIsActive(b.is_active)
      setDisplayOrder(b.display_order)
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
    if (!imageUrl) {
      toast.error("Image is required")
      return
    }
    try {
      await updateBanner.mutateAsync({
        image_url: imageUrl,
        type,
        is_active: isActive,
        display_order: displayOrder,
      })
      toast.success("Banner updated")
    } catch (e) {
      toast.error("Failed to update banner")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this banner?")) return
    try {
      await deleteBanner.mutateAsync(id!)
      toast.success("Banner deleted")
      navigate("/banners")
    } catch (e) {
      toast.error("Failed to delete banner")
    }
  }

  if (isLoading) {
    return <Container><Heading level="h1">Loading...</Heading></Container>
  }

  if (error || !data?.banner) {
    return <Container><Heading level="h1">Banner not found</Heading></Container>
  }

  return (
    <Container>
      <div className="flex items-center justify-between">
        <Heading level="h1">Edit Banner</Heading>
        <div className="flex gap-2">
          <Button variant="secondary" size="small" onClick={() => navigate("/banners")}>
            Back
          </Button>
          <Button variant="danger" size="small" onClick={handleDelete}>
            <Trash /> Delete
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div>
          <Text size="small" weight="plus" className="mb-1">Banner Image</Text>
          <div className="flex items-center gap-4">
            {imageUrl && (
              <img src={imageUrl} alt="Banner" className="h-20 w-32 rounded border object-cover" />
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
          <Text size="small" weight="plus" className="mb-1">Banner Type</Text>
          <Select value={type} onValueChange={(val) => setType(val as "hero" | "past_customer" | "partners")}>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="hero">Hero Section</Select.Item>
              <Select.Item value="past_customer">Past Customer Logo</Select.Item>
              <Select.Item value="partners">Partners</Select.Item>
            </Select.Content>
          </Select>
        </div>

        <div>
          <Text size="small" weight="plus" className="mb-1">Display Order</Text>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
            className="border-ui-border-base bg-ui-bg-field shadow-borders-base txt-compact-small h-8 w-full rounded-md px-2 py-1"
          />
          <Text size="xsmall" className="mt-1 text-ui-fg-subtle">
            Lower numbers appear first.
          </Text>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="is_active"
            checked={isActive}
            onCheckedChange={(val) => setIsActive(val as boolean)}
          />
          <Label htmlFor="is_active" size="small">
            Active (visible on storefront)
          </Label>
        </div>

        <div>
          <Button onClick={handleSave} isLoading={updateBanner.isPending}>
            Save Changes
          </Button>
        </div>
      </div>
    </Container>
  )
}

export default BannerDetailPage
