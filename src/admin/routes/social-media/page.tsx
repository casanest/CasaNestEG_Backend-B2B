import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Table, IconButton, toast, StatusBadge } from "@medusajs/ui"
import { useSocialMedia, useDeleteSocialMedia, PLATFORM_OPTIONS, type SocialMedia } from "../../hooks/api/social-media"
import { useNavigate } from "react-router-dom"
import { PencilSquare, Trash, PlusMini } from "@medusajs/icons"

const SocialMediaListPage = () => {
  const navigate = useNavigate()
  const { data, isLoading, error } = useSocialMedia()
  const deleteSocialMedia = useDeleteSocialMedia()

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this social media link?")) return
    try {
      await deleteSocialMedia.mutateAsync(id)
      toast.success("Social media link deleted")
    } catch (e) {
      toast.error("Failed to delete social media link")
    }
  }

  const getPlatformLabel = (platform: string) => {
    const option = PLATFORM_OPTIONS.find((o) => o.value === platform)
    return option ? option.label : platform
  }

  if (isLoading) {
    return (
      <Container>
        <Heading level="h1">Social Media</Heading>
        <div className="mt-4">Loading...</div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Heading level="h1">Social Media</Heading>
        <div className="mt-4 text-ui-fg-error">Error loading social media links</div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex items-center justify-between">
        <Heading level="h1">Social Media Links</Heading>
        <Button size="small" variant="secondary" onClick={() => navigate("/social-media/create")}>
          <PlusMini /> Add Social Link
        </Button>
      </div>

      <div className="mt-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Platform</Table.HeaderCell>
              <Table.HeaderCell>URL</Table.HeaderCell>
              <Table.HeaderCell>Label</Table.HeaderCell>
              <Table.HeaderCell>Description</Table.HeaderCell>
              <Table.HeaderCell>Order</Table.HeaderCell>
              <Table.HeaderCell>Published</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data?.socialMedia?.map((item: SocialMedia) => (
              <Table.Row
                key={item.id}
                className="cursor-pointer"
                onClick={() => navigate(`/social-media/${item.id}`)}
              >
                <Table.Cell>{getPlatformLabel(item.platform)}</Table.Cell>
                <Table.Cell className="max-w-[300px] truncate">{item.url}</Table.Cell>
                <Table.Cell>{item.label || "-"}</Table.Cell>
                <Table.Cell className="max-w-[200px] truncate">{item.description || "-"}</Table.Cell>
                <Table.Cell>{item.display_order}</Table.Cell>
                <Table.Cell>
                  <StatusBadge color={item.is_published ? "green" : "grey"}>
                    {item.is_published ? "Published" : "Draft"}
                  </StatusBadge>
                </Table.Cell>
                <Table.Cell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <IconButton size="small" onClick={() => navigate(`/social-media/${item.id}`)}>
                      <PencilSquare />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(item.id)}>
                      <Trash />
                    </IconButton>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>

        {data?.socialMedia?.length === 0 && (
          <div className="mt-4 text-center text-ui-fg-subtle">No social media links found</div>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Social Media",
})

export default SocialMediaListPage
