import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Table, IconButton, toast, StatusBadge, Switch } from "@medusajs/ui"
import { useTestimonials, useDeleteTestimonial, type Testimonial } from "../../hooks/api/testimonials"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { PencilSquare, Trash, PlusMini } from "@medusajs/icons"

const TestimonialsListPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useTestimonials()
  const deleteTestimonial = useDeleteTestimonial()

  const handleToggleHomepage = async (testimonial: Testimonial) => {
    const newValue = !testimonial.is_in_homepage
    try {
      const response = await fetch(`/admin/testimonials/${testimonial.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_in_homepage: newValue }),
      })
      if (!response.ok) throw new Error("Failed to update testimonial")
      toast.success(`Testimonial ${newValue ? "added to" : "removed from"} homepage`)
      queryClient.setQueryData(["testimonials"], (old: any) => {
        if (!old) return old
        return {
          ...old,
          testimonials: old.testimonials.map((t: Testimonial) =>
            t.id === testimonial.id ? { ...t, is_in_homepage: newValue } : t
          ),
        }
      })
    } catch (e) {
      toast.error("Failed to update testimonial")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return
    try {
      await deleteTestimonial.mutateAsync(id)
      toast.success("Testimonial deleted")
    } catch (e) {
      toast.error("Failed to delete testimonial")
    }
  }

  if (isLoading) {
    return (
      <Container>
        <Heading level="h1">Testimonials</Heading>
        <div className="mt-4">Loading...</div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Heading level="h1">Testimonials</Heading>
        <div className="mt-4 text-ui-fg-error">Error loading testimonials</div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex items-center justify-between">
        <Heading level="h1">What Our Clients Say</Heading>
        <Button size="small" variant="secondary" onClick={() => navigate("/testimonials/create")}>
          <PlusMini /> Create Testimonial
        </Button>
      </div>

      <div className="mt-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Image</Table.HeaderCell>
              <Table.HeaderCell>Name (EN)</Table.HeaderCell>
              <Table.HeaderCell>Name (AR)</Table.HeaderCell>
              <Table.HeaderCell>Position (EN)</Table.HeaderCell>
              <Table.HeaderCell>Order</Table.HeaderCell>
              <Table.HeaderCell>Published</Table.HeaderCell>
              <Table.HeaderCell>Homepage</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data?.testimonials?.map((t: Testimonial) => (
              <Table.Row
                key={t.id}
                className="cursor-pointer"
                onClick={() => navigate(`/testimonials/${t.id}`)}
              >
                <Table.Cell>
                  {t.image_url ? (
                    <img
                      src={t.image_url}
                      alt={t.name_en}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-ui-bg-subtle" />
                  )}
                </Table.Cell>
                <Table.Cell>{t.name_en}</Table.Cell>
                <Table.Cell dir="rtl">{t.name_ar}</Table.Cell>
                <Table.Cell>{t.position_en}</Table.Cell>
                <Table.Cell>{t.display_order}</Table.Cell>
                <Table.Cell>
                  <StatusBadge color={t.is_published ? "green" : "grey"}>
                    {t.is_published ? "Published" : "Draft"}
                  </StatusBadge>
                </Table.Cell>
                <Table.Cell onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={t.is_in_homepage}
                    onCheckedChange={() => handleToggleHomepage(t)}
                  />
                </Table.Cell>
                <Table.Cell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <IconButton size="small" onClick={() => navigate(`/testimonials/${t.id}`)}>
                      <PencilSquare />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(t.id)}>
                      <Trash />
                    </IconButton>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>

        {data?.testimonials?.length === 0 && (
          <div className="mt-4 text-center text-ui-fg-subtle">No testimonials found</div>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Testimonials",
})

export default TestimonialsListPage
