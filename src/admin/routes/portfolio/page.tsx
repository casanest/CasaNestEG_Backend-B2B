import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Table, Text, Drawer, IconButton, toast } from "@medusajs/ui"
import { usePortfolioCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, type PortfolioCategory } from "../../hooks/api/portfolio"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { PencilSquare, Trash, XMark } from "@medusajs/icons"

const CategoryListPage = () => {
  const navigate = useNavigate()
  const { data, isLoading, error } = usePortfolioCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<PortfolioCategory | null>(null)
  const [slug, setSlug] = useState("")
  const [nameEn, setNameEn] = useState("")
  const [nameAr, setNameAr] = useState("")

  const openCreate = () => {
    setEditingCategory(null)
    setSlug("")
    setNameEn("")
    setNameAr("")
    setDrawerOpen(true)
  }

  const openEdit = (category: PortfolioCategory) => {
    setEditingCategory(category)
    setSlug(category.slug)
    setNameEn(category.name_en)
    setNameAr(category.name_ar)
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    if (!slug || !nameEn || !nameAr) {
      toast.error("All fields are required")
      return
    }

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          slug,
          name_en: nameEn,
          name_ar: nameAr,
        })
        toast.success("Category updated")
      } else {
        await createCategory.mutateAsync({ slug, name_en: nameEn, name_ar: nameAr })
        toast.success("Category created")
      }
      setDrawerOpen(false)
    } catch (e) {
      toast.error("Failed to save category")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category and all its projects?")) return
    try {
      await deleteCategory.mutateAsync(id)
      toast.success("Category deleted")
    } catch (e) {
      toast.error("Failed to delete category")
    }
  }

  if (isLoading) {
    return (
      <Container>
        <Heading level="h1">Portfolio Categories</Heading>
        <div className="mt-4">Loading...</div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Heading level="h1">Portfolio Categories</Heading>
        <div className="mt-4 text-ui-fg-error">Error loading categories</div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex items-center justify-between">
        <Heading level="h1">Portfolio Categories</Heading>
        <Button size="small" onClick={openCreate}>Create Category</Button>
      </div>

      <div className="mt-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name (EN)</Table.HeaderCell>
              <Table.HeaderCell>Name (AR)</Table.HeaderCell>
              <Table.HeaderCell>Slug</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data?.categories?.map((category) => (
              <Table.Row
                key={category.id}
                className="cursor-pointer"
                onClick={() => navigate(`/portfolio/${category.id}`)}
              >
                <Table.Cell>{category.name_en}</Table.Cell>
                <Table.Cell dir="rtl">{category.name_ar}</Table.Cell>
                <Table.Cell>{category.slug}</Table.Cell>
                <Table.Cell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <IconButton size="small" onClick={() => openEdit(category)}>
                      <PencilSquare />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(category.id)}>
                      <Trash />
                    </IconButton>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>

        {data?.categories?.length === 0 && (
          <div className="mt-4 text-center text-ui-fg-subtle">No categories found</div>
        )}
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>
              {editingCategory ? "Edit Category" : "Create Category"}
            </Drawer.Title>
            <Drawer.Description>
              Bilingual category for portfolio projects
            </Drawer.Description>
          </Drawer.Header>
          <Drawer.Body>
            <div className="flex flex-col gap-4">
              <div>
                <Text size="small" weight="plus" className="mb-1">Slug</Text>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="hotels"
                />
              </div>
              <div>
                <Text size="small" weight="plus" className="mb-1">Name (English)</Text>
                <Input
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="Hotels"
                />
              </div>
              <div>
                <Text size="small" weight="plus" className="mb-1">Name (Arabic)</Text>
                <Input
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="فنادق"
                  dir="rtl"
                />
              </div>
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              isLoading={createCategory.isPending || updateCategory.isPending}
            >
              {editingCategory ? "Save" : "Create"}
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Portfolio",
})

export default CategoryListPage
