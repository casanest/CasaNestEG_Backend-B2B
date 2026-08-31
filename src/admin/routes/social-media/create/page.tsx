import { Container, Heading, Input, Text, Button, Checkbox, Label, Select, toast } from "@medusajs/ui"
import { useCreateSocialMedia, PLATFORM_OPTIONS } from "../../../hooks/api/social-media"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

const CreateSocialMediaPage = () => {
  const navigate = useNavigate()
  const createSocialMedia = useCreateSocialMedia()

  const [platform, setPlatform] = useState("facebook")
  const [url, setUrl] = useState("")
  const [label, setLabel] = useState("")
  const [displayOrder, setDisplayOrder] = useState(0)
  const [isPublished, setIsPublished] = useState(false)

  const handleSave = async () => {
    if (!platform || !url) {
      toast.error("Platform and URL are required")
      return
    }

    try {
      const result = await createSocialMedia.mutateAsync({
        platform,
        url,
        label: label || null,
        display_order: displayOrder,
        is_published: isPublished,
      })
      toast.success("Social media link created")
      navigate(`/social-media/${result.socialMedia.id}`)
    } catch (e) {
      toast.error("Failed to create social media link")
    }
  }

  return (
    <Container>
      <div className="flex items-center justify-between">
        <Heading level="h1">Add Social Media Link</Heading>
        <Button variant="secondary" size="small" onClick={() => navigate("/social-media")}>
          Back
        </Button>
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
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://facebook.com/yourpage"
          />
        </div>

        <div>
          <Text size="small" weight="plus" className="mb-1">Label (optional)</Text>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Follow us on Facebook"
          />
          <Text size="xsmall" className="mt-1 text-ui-fg-subtle">
            Optional display label for the link.
          </Text>
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

        <div className="mt-4">
          <Button
            onClick={handleSave}
            isLoading={createSocialMedia.isPending}
          >
            Create Social Media Link
          </Button>
        </div>
      </div>
    </Container>
  )
}

export default CreateSocialMediaPage
