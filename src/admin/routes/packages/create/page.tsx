import { Container, Heading, Input, Textarea, Text, Button, Checkbox, Label, Switch, toast } from "@medusajs/ui"
import { useCreatePackage } from "../../../hooks/api/packages"
import { uploadFile } from "../../../lib/upload"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

const CreatePackagePage = () => {
  const navigate = useNavigate()
  const createPackage = useCreatePackage()

  const [nameEn, setNameEn] = useState("")
  const [nameAr, setNameAr] = useState("")
  const [descriptionEn, setDescriptionEn] = useState("")
  const [descriptionAr, setDescriptionAr] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [isInHomepage, setIsInHomepage] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleNameEnChange = (val: string) => {
    setNameEn(val)
    if (!slugTouched) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      )
    }
  }

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
    if (!nameEn || !nameAr) {
      toast.error("Name (EN) and Name (AR) are required")
      return
    }

    try {
      const result = await createPackage.mutateAsync({
        slug: slug || undefined,
        name_en: nameEn,
        name_ar: nameAr,
        description_en: descriptionEn || null,
        description_ar: descriptionAr || null,
        image_url: imageUrl,
        is_published: isPublished,
        is_in_homepage: isInHomepage,
      })
      toast.success("Package created")
      navigate(`/packages/${result.package.id}`)
    } catch (e) {
      toast.error("Failed to create package")
    }
  }

  return (
    <Container>
      <div className="flex items-center justify-between">
        <Heading level="h1">Create Package</Heading>
        <Button variant="secondary" size="small" onClick={() => navigate("/packages")}>
          Back
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div>
          <Text size="small" weight="plus" className="mb-1">Name (English)</Text>
          <Input
            value={nameEn}
            onChange={(e) => handleNameEnChange(e.target.value)}
            placeholder="Bedroom Set"
          />
        </div>

        <div>
          <Text size="small" weight="plus" className="mb-1">Name (Arabic)</Text>
          <Input
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder="غرفة نوم"
            dir="rtl"
          />
        </div>

        <div>
          <Text size="small" weight="plus" className="mb-1">Slug</Text>
          <Input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugTouched(true)
            }}
            placeholder="bedroom-set"
          />
          <Text size="xsmall" className="mt-1 text-ui-fg-subtle">
            Auto-generated from name. Changing the slug breaks existing storefront links.
          </Text>
        </div>

        <div>
          <Text size="small" weight="plus" className="mb-1">Description (English)</Text>
          <Textarea
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            placeholder="Package description..."
          />
        </div>

        <div>
          <Text size="small" weight="plus" className="mb-1">Description (Arabic)</Text>
          <Textarea
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
            placeholder="وصف الباقة..."
            dir="rtl"
          />
        </div>

        <div>
          <Text size="small" weight="plus" className="mb-1">Package Image</Text>
          <div className="flex items-center gap-4">
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Package"
                className="h-20 w-20 rounded border object-cover"
              />
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

        <div className="mt-4">
          <Button
            onClick={handleSave}
            isLoading={createPackage.isPending}
          >
            Create Package
          </Button>
        </div>
      </div>
    </Container>
  )
}

export default CreatePackagePage
