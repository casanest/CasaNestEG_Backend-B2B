import { Container, Heading, Input, Text, Button, Checkbox, Label, Select, toast } from "@medusajs/ui"
import {
  useSocialMediaItem,
  useUpdateSocialMedia,
  useDeleteSocialMedia,
  PLATFORM_OPTIONS,
} from "../../../hooks/api/social-media"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { Trash } from "@medusajs/icons"

const SocialMediaDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useSocialMediaItem(id ?? "")
  const updateSocialMedia = useUpdateSocialMedia(id ?? "")
  const deleteSocialMedia = useDeleteSocialMedia()

  const [platform, setPlatform] = useState("facebook")
  const [url, setUrl] = useState("")
  const [label, setLabel] = useState("")
  const [displayOrder, setDisplayOrder] = useState(0)
  const [isPublished, setIsPublished] = useState(false)

  useEffect(() => {
    if (data?.socialMedia) {
      const item = data.socialMedia
      setPlatform(item.platform)
      setUrl(item.url)
      setLabel(item.label || "")
      setDisplayOrder(item.display_order)
      setIsPublished(item.is_published)
    }
  }, [data])

  const handleSave = async () => {
    if (!platform || !url) {
      toast.error("Platform and URL are required")
      return
    }
    try {
      await updateSocialMedia.mutateAsync({
        platform,
        url,
        label: label || null,
        display_order: displayOrder,
        is_published: isPublished,
      })
      toast.success("Social media link updated")
    } catch (e) {
      toast.error("Failed to update social media link")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this social media link?")) return
    try {
      await deleteSocialMedia.mutateAsync(id!)
      toast.success("Social media link deleted")
      navigate("/social-media")
    } catch (e) {
      toast.error("Failed to delete social media link")
    }
  }

  if (isLoading) {
    return <Container><Heading level="h1">Loading...</Heading></Container>
  }

  if (error || !data?.socialMedia) {
    return <Container><Heading level="h1">Social media link not found</Heading></Container>
  }

  return (
    <Container>
      <div className="flex items-center justify-between">
        <Heading level="h1">{data.socialMedia.platform}</Heading>
        <div className="flex gap-2">
          <Button variant="secondary" size="small" onClick={() => navigate("/social-media")}>
            Back
          </Button>
          <Button variant="danger" size="small" onClick={handleDelete}>
            <Trash /> Delete
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div>
          <Text size="small" weight="plus" className="mb-1">Platform</Text>
          <Select value={platform} onValueChange={setPlatform}>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {PLATFORM_OPTIONS.map((opt) => (
                <Select.Item key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>

        <div>
          <Text size="small" weight="plus" className="mb-1">URL</Text>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>

        <div>
          <Text size="small" weight="plus" className="mb-1">Label (optional)</Text>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>

        <div>
          <Text size="small" weight="plus" className="mb-1">Display Order</Text>
          <Input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
          />
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
          <Button onClick={handleSave} isLoading={updateSocialMedia.isPending}>
            Save Changes
          </Button>
        </div>
      </div>
    </Container>
  )
}

export default SocialMediaDetailPage
