import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Table, IconButton, toast, StatusBadge, Switch } from "@medusajs/ui"
import { useBanners, useDeleteBanner, type Banner } from "../../hooks/api/banners"
import { useNavigate } from "react-router-dom"
import { PencilSquare, Trash, PlusMini } from "@medusajs/icons"

const BannersListPage = () => {
  const navigate = useNavigate()
  const { data, isLoading, error } = useBanners()
  const deleteBanner = useDeleteBanner()

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return
    try {
      await deleteBanner.mutateAsync(id)
      toast.success("Banner deleted")
    } catch (e) {
      toast.error("Failed to delete banner")
    }
  }

  const handleToggleActive = async (banner: Banner) => {
    try {
      const response = await fetch(`/admin/banners/${banner.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !banner.is_active }),
      })
      if (!response.ok) throw new Error("Failed to update banner")
      toast.success(`Banner ${!banner.is_active ? "activated" : "deactivated"}`)
    } catch (e) {
      toast.error("Failed to update banner")
    }
  }

  if (isLoading) {
    return (
      <Container>
        <Heading level="h1">Banners</Heading>
        <div className="mt-4">Loading...</div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Heading level="h1">Banners</Heading>
        <div className="mt-4 text-ui-fg-error">Error loading banners</div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex items-center justify-between">
        <Heading level="h1">Banners</Heading>
        <Button size="small" variant="secondary" onClick={() => navigate("/banners/create")}>
          <PlusMini /> Create Banner
        </Button>
      </div>

      <div className="mt-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Image</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Order</Table.HeaderCell>
              <Table.HeaderCell>Active</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data?.banners?.map((b: Banner) => (
              <Table.Row
                key={b.id}
                className="cursor-pointer"
                onClick={() => navigate(`/banners/${b.id}`)}
              >
                <Table.Cell>
                  <img
                    src={b.image_url}
                    alt="Banner"
                    className="h-10 w-16 rounded object-cover"
                  />
                </Table.Cell>
                <Table.Cell>
                  <StatusBadge color={b.type === "hero" ? "blue" : b.type === "past_customer" ? "purple" : "green"}>
                    {b.type === "hero" ? "Hero" : b.type === "past_customer" ? "Past Customer" : "Partners"}
                  </StatusBadge>
                </Table.Cell>
                <Table.Cell>{b.display_order}</Table.Cell>
                <Table.Cell onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={b.is_active}
                    onCheckedChange={() => handleToggleActive(b)}
                  />
                </Table.Cell>
                <Table.Cell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <IconButton size="small" onClick={() => navigate(`/banners/${b.id}`)}>
                      <PencilSquare />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(b.id)}>
                      <Trash />
                    </IconButton>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>

        {data?.banners?.length === 0 && (
          <div className="mt-4 text-center text-ui-fg-subtle">No banners found</div>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Banners",
})

export default BannersListPage
