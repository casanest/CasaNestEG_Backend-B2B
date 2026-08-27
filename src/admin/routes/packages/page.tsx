import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Table, IconButton, toast, StatusBadge } from "@medusajs/ui"
import { usePackages, useDeletePackage, type Package } from "../../hooks/api/packages"
import { useNavigate } from "react-router-dom"
import { PencilSquare, Trash, PlusMini } from "@medusajs/icons"

const PackagesListPage = () => {
  const navigate = useNavigate()
  const { data, isLoading, error } = usePackages()
  const deletePackage = useDeletePackage()

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this package and all its titles?")) return
    try {
      await deletePackage.mutateAsync(id)
      toast.success("Package deleted")
    } catch (e) {
      toast.error("Failed to delete package")
    }
  }

  if (isLoading) {
    return (
      <Container>
        <Heading level="h1">Packages</Heading>
        <div className="mt-4">Loading...</div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Heading level="h1">Packages</Heading>
        <div className="mt-4 text-ui-fg-error">Error loading packages</div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex items-center justify-between">
        <Heading level="h1">Packages</Heading>
        <Button size="small" variant="secondary" onClick={() => navigate("/packages/create")}>
          <PlusMini /> Create Package
        </Button>
      </div>

      <div className="mt-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Image</Table.HeaderCell>
              <Table.HeaderCell>Name (EN)</Table.HeaderCell>
              <Table.HeaderCell>Name (AR)</Table.HeaderCell>
              <Table.HeaderCell>Slug</Table.HeaderCell>
              <Table.HeaderCell>Published</Table.HeaderCell>
              <Table.HeaderCell>Titles</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data?.packages?.map((pkg: Package) => (
              <Table.Row
                key={pkg.id}
                className="cursor-pointer"
                onClick={() => navigate(`/packages/${pkg.id}`)}
              >
                <Table.Cell>
                  {pkg.image_url ? (
                    <img
                      src={pkg.image_url}
                      alt={pkg.name_en}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-ui-bg-subtle" />
                  )}
                </Table.Cell>
                <Table.Cell>{pkg.name_en}</Table.Cell>
                <Table.Cell dir="rtl">{pkg.name_ar}</Table.Cell>
                <Table.Cell>{pkg.slug}</Table.Cell>
                <Table.Cell>
                  <StatusBadge color={pkg.is_published ? "green" : "grey"}>
                    {pkg.is_published ? "Published" : "Draft"}
                  </StatusBadge>
                </Table.Cell>
                <Table.Cell>{pkg.titles_count ?? 0}</Table.Cell>
                <Table.Cell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <IconButton size="small" onClick={() => navigate(`/packages/${pkg.id}`)}>
                      <PencilSquare />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(pkg.id)}>
                      <Trash />
                    </IconButton>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>

        {data?.packages?.length === 0 && (
          <div className="mt-4 text-center text-ui-fg-subtle">No packages found</div>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Packages",
})

export default PackagesListPage
