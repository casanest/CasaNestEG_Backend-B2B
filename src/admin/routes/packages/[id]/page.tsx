import { Container, Heading, Input, Textarea, Text, Button, Checkbox, Label, Table, IconButton, toast, Drawer, Switch } from "@medusajs/ui"
import {
  usePackage,
  useUpdatePackage,
  useDeletePackage,
  useCreateTitle,
  useDeleteTitle,
  useReorderTitles,
  type PackageTitle,
} from "../../../hooks/api/packages"
import { uploadFile } from "../../../lib/upload"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { PencilSquare, Trash, ArrowUpMini, ArrowDownMini, PlusMini } from "@medusajs/icons"

const PackageDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = usePackage(id ?? "")
  const updatePackage = useUpdatePackage(id ?? "")
  const deletePackage = useDeletePackage()
  const createTitle = useCreateTitle(id ?? "")
  const deleteTitle = useDeleteTitle(id ?? "")
  const reorderTitles = useReorderTitles(id ?? "")

  const [nameEn, setNameEn] = useState("")
  const [nameAr, setNameAr] = useState("")
  const [descriptionEn, setDescriptionEn] = useState("")
  const [descriptionAr, setDescriptionAr] = useState("")
  const [slug, setSlug] = useState("")
  const [isPublished, setIsPublished] = useState(false)
  const [isInHomepage, setIsInHomepage] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [titleNameEn, setTitleNameEn] = useState("")
  const [titleNameAr, setTitleNameAr] = useState("")

  useEffect(() => {
    if (data?.package) {
      const pkg = data.package
      setNameEn(pkg.name_en)
      setNameAr(pkg.name_ar)
      setDescriptionEn(pkg.description_en ?? "")
      setDescriptionAr(pkg.description_ar ?? "")
      setSlug(pkg.slug)
      setIsPublished(pkg.is_published)
      setIsInHomepage(pkg.is_in_homepage)
      setImageUrl(pkg.image_url)
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

  const handleSavePackage = async () => {
    if (!nameEn || !nameAr) {
      toast.error("Name (EN) and Name (AR) are required")
      return
    }
    try {
      await updatePackage.mutateAsync({
        slug,
        name_en: nameEn,
        name_ar: nameAr,
        description_en: descriptionEn || null,
        description_ar: descriptionAr || null,
        image_url: imageUrl,
        is_published: isPublished,
        is_in_homepage: isInHomepage,
      })
      toast.success("Package updated")
    } catch (e) {
      toast.error("Failed to update package")
    }
  }

  const handleDeletePackage = async () => {
    if (!confirm("Delete this package and all its titles?")) return
    try {
      await deletePackage.mutateAsync(id!)
      toast.success("Package deleted")
      navigate("/packages")
    } catch (e) {
      toast.error("Failed to delete package")
    }
  }

  const handleCreateTitle = async () => {
    if (!titleNameEn || !titleNameAr) {
      toast.error("Title name (EN) and (AR) are required")
      return
    }
    try {
      await createTitle.mutateAsync({ name_en: titleNameEn, name_ar: titleNameAr })
      toast.success("Title added")
      setTitleNameEn("")
      setTitleNameAr("")
      setDrawerOpen(false)
    } catch (e) {
      toast.error("Failed to create title")
    }
  }

  const handleDeleteTitle = async (titleId: string) => {
    if (!confirm("Delete this title?")) return
    try {
      await deleteTitle.mutateAsync(titleId)
      toast.success("Title deleted")
    } catch (e) {
      toast.error("Failed to delete title")
    }
  }

  const handleMoveTitle = async (titles: PackageTitle[], index: number, direction: "up" | "down") => {
    const newTitles = [...titles]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newTitles.length) return
    ;[newTitles[index], newTitles[targetIndex]] = [newTitles[targetIndex], newTitles[index]]
    try {
      await reorderTitles.mutateAsync(newTitles.map((t) => t.id))
    } catch (e) {
      toast.error("Failed to reorder titles")
    }
  }

  if (isLoading) {
    return <Container><Heading level="h1">Loading...</Heading></Container>
  }

  if (error || !data?.package) {
    return <Container><Heading level="h1">Package not found</Heading></Container>
  }

  const pkg = data.package
  const titles = pkg.titles ?? []

  return (
    <Container>
      <div className="flex items-center justify-between">
        <Heading level="h1">{pkg.name_en}</Heading>
        <div className="flex gap-2">
          <Button variant="secondary" size="small" onClick={() => navigate("/packages")}>
            Back
          </Button>
          <Button variant="danger" size="small" onClick={handleDeletePackage}>
            <Trash /> Delete
          </Button>
        </div>
      </div>

      {/* Edit form */}
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

        <div>
          <Text size="small" weight="plus" className="mb-1">Slug</Text>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Text size="xsmall" className="mt-1 text-ui-fg-subtle">
            Changing the slug breaks existing storefront links.
          </Text>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text size="small" weight="plus" className="mb-1">Description (English)</Text>
            <Textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} />
          </div>
          <div>
            <Text size="small" weight="plus" className="mb-1">Description (Arabic)</Text>
            <Textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} dir="rtl" />
          </div>
        </div>

        <div>
          <Text size="small" weight="plus" className="mb-1">Package Image</Text>
          <div className="flex items-center gap-4">
            {imageUrl && (
              <img src={imageUrl} alt="Package" className="h-20 w-20 rounded border object-cover" />
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

        <div className="flex items-center gap-3">
          <Switch
            id="is_in_homepage"
            checked={isInHomepage}
            onCheckedChange={(val) => setIsInHomepage(val as boolean)}
          />
          <Label htmlFor="is_in_homepage" size="small">
            Show on homepage
          </Label>
        </div>

        <div>
          <Button onClick={handleSavePackage} isLoading={updatePackage.isPending}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Titles section */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <Heading level="h2">Titles</Heading>
          <Button size="small" variant="secondary" onClick={() => setDrawerOpen(true)}>
            <PlusMini /> Add Title
          </Button>
        </div>

        <div className="mt-4">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Order</Table.HeaderCell>
                <Table.HeaderCell>Name (EN)</Table.HeaderCell>
                <Table.HeaderCell>Name (AR)</Table.HeaderCell>
                <Table.HeaderCell>Products</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {titles.map((title, index) => (
                <Table.Row
                  key={title.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/packages/${id}/titles/${title.id}`)}
                >
                  <Table.Cell>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        onClick={() => handleMoveTitle(titles, index, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUpMini />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleMoveTitle(titles, index, "down")}
                        disabled={index === titles.length - 1}
                      >
                        <ArrowDownMini />
                      </IconButton>
                    </div>
                  </Table.Cell>
                  <Table.Cell>{title.name_en}</Table.Cell>
                  <Table.Cell dir="rtl">{title.name_ar}</Table.Cell>
                  <Table.Cell>{title.products?.length ?? 0}</Table.Cell>
                  <Table.Cell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/packages/${id}/titles/${title.id}`)}
                      >
                        <PencilSquare />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteTitle(title.id)}>
                        <Trash />
                      </IconButton>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          {titles.length === 0 && (
            <div className="mt-4 text-center text-ui-fg-subtle">No titles yet</div>
          )}
        </div>
      </div>

      {/* Add title drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Add Title</Drawer.Title>
            <Drawer.Description>Add a new title to this package</Drawer.Description>
          </Drawer.Header>
          <Drawer.Body>
            <div className="flex flex-col gap-4">
              <div>
                <Text size="small" weight="plus" className="mb-1">Name (English)</Text>
                <Input
                  value={titleNameEn}
                  onChange={(e) => setTitleNameEn(e.target.value)}
                  placeholder="Bed Frame"
                />
              </div>
              <div>
                <Text size="small" weight="plus" className="mb-1">Name (Arabic)</Text>
                <Input
                  value={titleNameAr}
                  onChange={(e) => setTitleNameAr(e.target.value)}
                  placeholder="إطار السرير"
                  dir="rtl"
                />
              </div>
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTitle} isLoading={createTitle.isPending}>
              Add Title
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

export default PackageDetailPage
