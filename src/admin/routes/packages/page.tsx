import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Table, IconButton, toast, StatusBadge, Switch } from "@medusajs/ui"
import { usePackages, useDeletePackage, type Package } from "../../hooks/api/packages"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { PencilSquare, Trash, PlusMini } from "@medusajs/icons"

const PackagesListPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = usePackages()
  const deletePackage = useDeletePackage()

  const handleToggleHomepage = async (pkg: Package) => {
    const newValue = !pkg.is_in_homepage
    try {
      const response = await fetch(`/admin/packages/${pkg.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_in_homepage: newValue }),
      })
      if (!response.ok) throw new Error("Failed to update package")
      toast.success(`Package ${newValue ? "added to" : "removed from"} homepage`)
      queryClient.setQueryData(["packages"], (old: any) => {
        if (!old) return old
        return {
          ...old,
          packages: old.packages.map((p: Package) =>
            p.id === pkg.id ? { ...p, is_in_homepage: newValue } : p
          ),
        }
      })
    } catch (e) {
      toast.error("Failed to update package")
    }
  }

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
              <Table.HeaderCell>Homepage</Table.HeaderCell>
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
                <Table.Cell onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={pkg.is_in_homepage}
                    onCheckedChange={() => handleToggleHomepage(pkg)}
                  />
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
