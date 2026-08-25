import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Button,
  Container,
  Heading,
  Input,
  Text,
  Textarea,
  Label,
  Checkbox,
  IconButton,
  toast,
} from "@medusajs/ui"
import { useState, useRef, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Trash, ArrowUpMini, ArrowDownMini, Plus } from "@medusajs/icons"
import {
  usePortfolioProject,
  useUpdateProject,
  type PortfolioMetric,
  type PortfolioSubParagraph,
  type PortfolioGalleryImage,
} from "../../../../hooks/api/portfolio"
import { uploadFile } from "../../../../lib/upload"

const ProjectEditPage = () => {
  const { categoryId, projectId } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = usePortfolioProject(projectId || "")
  const updateProject = useUpdateProject(projectId || "")

  const [slug, setSlug] = useState("")
  const [titleEn, setTitleEn] = useState("")
  const [titleAr, setTitleAr] = useState("")
  const [locationEn, setLocationEn] = useState("")
  const [locationAr, setLocationAr] = useState("")
  const [heroImageUrl, setHeroImageUrl] = useState("")
  const [projectDate, setProjectDate] = useState("")
  const [isInHomepage, setIsInHomepage] = useState(false)

  const [metrics, setMetrics] = useState<PortfolioMetric[]>([])
  const [subParagraphs, setSubParagraphs] = useState<PortfolioSubParagraph[]>([])
  const [galleryImages, setGalleryImages] = useState<PortfolioGalleryImage[]>([])

  const [uploadingHero, setUploadingHero] = useState(false)
  const heroInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (data?.project) {
      const p = data.project
      setSlug(p.slug || "")
      setTitleEn(p.title_en || "")
      setTitleAr(p.title_ar || "")
      setLocationEn(p.location_en || "")
      setLocationAr(p.location_ar || "")
      setHeroImageUrl(p.hero_image_url || "")
      const dateStr = p.project_date ? new Date(p.project_date).toISOString().split("T")[0] : ""
      setProjectDate(dateStr)
      setIsInHomepage(p.is_in_homepage ?? false)
      setMetrics((p.metrics ?? []).map((m: any) => ({
        id: m.id,
        label_en: m.label_en,
        label_ar: m.label_ar,
        value_en: m.value_en,
        value_ar: m.value_ar,
        display_order: m.display_order,
      })))
      setSubParagraphs((p.sub_paragraphs ?? []).map((s: any) => ({
        id: s.id,
        heading_en: s.heading_en,
        heading_ar: s.heading_ar,
        text_en: s.text_en,
        text_ar: s.text_ar,
        image_url: s.image_url,
        display_order: s.display_order,
      })))
      setGalleryImages((p.gallery_images ?? []).map((g: any) => ({
        id: g.id,
        image_url: g.image_url,
        display_order: g.display_order,
      })))
    }
  }, [data])

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingHero(true)
    try {
      const url = await uploadFile(file)
      setHeroImageUrl(url)
      toast.success("Hero image uploaded")
    } catch {
      toast.error("Failed to upload hero image")
    } finally {
      setUploadingHero(false)
    }
  }

  const addMetric = () => {
    setMetrics([...metrics, { label_en: "", label_ar: "", value_en: "", value_ar: "", display_order: metrics.length }])
  }
  const updateMetric = (index: number, field: keyof PortfolioMetric, value: any) => {
    const updated = [...metrics]
    updated[index] = { ...updated[index], [field]: value }
    setMetrics(updated)
  }
  const removeMetric = (index: number) => {
    setMetrics(metrics.filter((_, i) => i !== index).map((m, i) => ({ ...m, display_order: i })))
  }
  const moveMetric = (index: number, dir: "up" | "down") => {
    if (dir === "up" && index === 0) return
    if (dir === "down" && index === metrics.length - 1) return
    const updated = [...metrics]
    const swapIndex = dir === "up" ? index - 1 : index + 1
    ;[updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]]
    setMetrics(updated.map((m, i) => ({ ...m, display_order: i })))
  }

  const addSubParagraph = () => {
    setSubParagraphs([...subParagraphs, { heading_en: "", heading_ar: "", text_en: "", text_ar: "", image_url: null, display_order: subParagraphs.length }])
  }
  const updateSubParagraph = (index: number, field: keyof PortfolioSubParagraph, value: any) => {
    const updated = [...subParagraphs]
    updated[index] = { ...updated[index], [field]: value }
    setSubParagraphs(updated)
  }
  const removeSubParagraph = (index: number) => {
    setSubParagraphs(subParagraphs.filter((_, i) => i !== index).map((s, i) => ({ ...s, display_order: i })))
  }
  const moveSubParagraph = (index: number, dir: "up" | "down") => {
    if (dir === "up" && index === 0) return
    if (dir === "down" && index === subParagraphs.length - 1) return
    const updated = [...subParagraphs]
    const swapIndex = dir === "up" ? index - 1 : index + 1
    ;[updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]]
    setSubParagraphs(updated.map((s, i) => ({ ...s, display_order: i })))
  }
  const handleSubParagraphImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await uploadFile(file)
      updateSubParagraph(index, "image_url", url)
      toast.success("Image uploaded")
    } catch {
      toast.error("Failed to upload image")
    }
  }

  const addGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newImages: PortfolioGalleryImage[] = []
    for (const file of Array.from(files)) {
      try {
        const url = await uploadFile(file)
        newImages.push({ image_url: url, display_order: galleryImages.length + newImages.length })
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    setGalleryImages([...galleryImages, ...newImages])
    if (newImages.length > 0) toast.success(`${newImages.length} image(s) uploaded`)
  }
  const removeGalleryImage = (index: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index).map((g, i) => ({ ...g, display_order: i })))
  }
  const moveGalleryImage = (index: number, dir: "up" | "down") => {
    if (dir === "up" && index === 0) return
    if (dir === "down" && index === galleryImages.length - 1) return
    const updated = [...galleryImages]
    const swapIndex = dir === "up" ? index - 1 : index + 1
    ;[updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]]
    setGalleryImages(updated.map((g, i) => ({ ...g, display_order: i })))
  }

  const handleSave = async () => {
    if (!slug || !titleEn || !titleAr || !locationEn || !locationAr || !heroImageUrl || !projectDate) {
      toast.error("Please fill all required fields")
      return
    }
    try {
      await updateProject.mutateAsync({
        slug,
        title_en: titleEn,
        title_ar: titleAr,
        location_en: locationEn,
        location_ar: locationAr,
        hero_image_url: heroImageUrl,
        project_date: projectDate,
        is_in_homepage: isInHomepage,
        metrics: metrics.map((m, i) => ({ ...m, display_order: i })),
        sub_paragraphs: subParagraphs.map((s, i) => ({ ...s, display_order: i })),
        gallery_images: galleryImages.map((g, i) => ({ ...g, display_order: i })),
      } as any)
      toast.success("Project updated")
      navigate(`/portfolio/${categoryId}`)
    } catch {
      toast.error("Failed to update project")
    }
  }

  if (isLoading) {
    return (
      <Container>
        <Heading level="h1">Edit Project</Heading>
        <div className="mt-4">Loading...</div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Heading level="h1">Edit Project</Heading>
        <div className="mt-4 text-ui-fg-error">Error loading project</div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="transparent" size="small" onClick={() => navigate(`/portfolio/${categoryId}`)}>
            <ArrowLeft />
          </Button>
          <Heading level="h1">Edit Project</Heading>
        </div>
        <Button size="small" onClick={handleSave} isLoading={updateProject.isPending}>
          Save Changes
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {/* Basic Info */}
        <div className="flex flex-col gap-4">
          <Heading level="h2">Basic Information</Heading>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Slug *</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <div>
              <Label>Project Date *</Label>
              <Input type="date" value={projectDate} onChange={(e) => setProjectDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Title (English) *</Label>
              <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
            </div>
            <div>
              <Label>Title (Arabic) *</Label>
              <Input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} dir="rtl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Location (English) *</Label>
              <Input value={locationEn} onChange={(e) => setLocationEn(e.target.value)} />
            </div>
            <div>
              <Label>Location (Arabic) *</Label>
              <Input value={locationAr} onChange={(e) => setLocationAr(e.target.value)} dir="rtl" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox checked={isInHomepage} onCheckedChange={(val) => setIsInHomepage(val === true)} id="homepage" />
            <Label htmlFor="homepage">Show on homepage</Label>
          </div>
        </div>

        {/* Hero Image */}
        <div className="flex flex-col gap-2">
          <Heading level="h2">Hero Image</Heading>
          <input ref={heroInputRef} type="file" accept="image/*" onChange={handleHeroUpload} className="hidden" />
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="small" onClick={() => heroInputRef.current?.click()} disabled={uploadingHero}>
              {uploadingHero ? "Uploading..." : "Replace Hero Image"}
            </Button>
            {heroImageUrl && <img src={heroImageUrl} alt="Hero" className="h-24 w-40 rounded object-cover" />}
          </div>
        </div>

        {/* Metrics */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Heading level="h2">Metrics</Heading>
            <Button variant="secondary" size="small" onClick={addMetric}>
              <Plus /> Add Metric
            </Button>
          </div>
          {metrics.map((metric, index) => (
            <div key={index} className="rounded-lg border border-ui-border-base p-4">
              <div className="mb-3 flex items-center justify-between">
                <Text weight="plus">Metric #{index + 1}</Text>
                <div className="flex items-center gap-1">
                  <IconButton size="small" onClick={() => moveMetric(index, "up")} disabled={index === 0}>
                    <ArrowUpMini />
                  </IconButton>
                  <IconButton size="small" onClick={() => moveMetric(index, "down")} disabled={index === metrics.length - 1}>
                    <ArrowDownMini />
                  </IconButton>
                  <IconButton size="small" onClick={() => removeMetric(index)}>
                    <Trash />
                  </IconButton>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Label (EN)</Label>
                  <Input value={metric.label_en} onChange={(e) => updateMetric(index, "label_en", e.target.value)} />
                </div>
                <div>
                  <Label>Label (AR)</Label>
                  <Input value={metric.label_ar} onChange={(e) => updateMetric(index, "label_ar", e.target.value)} dir="rtl" />
                </div>
                <div>
                  <Label>Value (EN)</Label>
                  <Input value={metric.value_en} onChange={(e) => updateMetric(index, "value_en", e.target.value)} />
                </div>
                <div>
                  <Label>Value (AR)</Label>
                  <Input value={metric.value_ar} onChange={(e) => updateMetric(index, "value_ar", e.target.value)} dir="rtl" />
                </div>
              </div>
            </div>
          ))}
          {metrics.length === 0 && <Text className="text-ui-fg-subtle">No metrics added</Text>}
        </div>

        {/* Sub-Paragraphs */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Heading level="h2">Sub-Paragraphs</Heading>
            <Button variant="secondary" size="small" onClick={addSubParagraph}>
              <Plus /> Add Section
            </Button>
          </div>
          {subParagraphs.map((sub, index) => (
            <div key={index} className="rounded-lg border border-ui-border-base p-4">
              <div className="mb-3 flex items-center justify-between">
                <Text weight="plus">Section #{index + 1}</Text>
                <div className="flex items-center gap-1">
                  <IconButton size="small" onClick={() => moveSubParagraph(index, "up")} disabled={index === 0}>
                    <ArrowUpMini />
                  </IconButton>
                  <IconButton size="small" onClick={() => moveSubParagraph(index, "down")} disabled={index === subParagraphs.length - 1}>
                    <ArrowDownMini />
                  </IconButton>
                  <IconButton size="small" onClick={() => removeSubParagraph(index)}>
                    <Trash />
                  </IconButton>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Heading (EN)</Label>
                  <Input value={sub.heading_en} onChange={(e) => updateSubParagraph(index, "heading_en", e.target.value)} />
                </div>
                <div>
                  <Label>Heading (AR)</Label>
                  <Input value={sub.heading_ar} onChange={(e) => updateSubParagraph(index, "heading_ar", e.target.value)} dir="rtl" />
                </div>
                <div>
                  <Label>Text (EN)</Label>
                  <Textarea value={sub.text_en} onChange={(e) => updateSubParagraph(index, "text_en", e.target.value)} rows={4} />
                </div>
                <div>
                  <Label>Text (AR)</Label>
                  <Textarea value={sub.text_ar} onChange={(e) => updateSubParagraph(index, "text_ar", e.target.value)} rows={4} dir="rtl" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSubParagraphImageUpload(index, e)}
                  className="hidden"
                  id={`sub-img-${index}`}
                />
                <Button variant="secondary" size="small" onClick={() => document.getElementById(`sub-img-${index}`)?.click()}>
                  {sub.image_url ? "Replace Image" : "Upload Image"}
                </Button>
                {sub.image_url && <img src={sub.image_url} alt="Section" className="h-16 w-24 rounded object-cover" />}
              </div>
            </div>
          ))}
          {subParagraphs.length === 0 && <Text className="text-ui-fg-subtle">No sub-paragraphs added</Text>}
        </div>

        {/* Gallery */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Heading level="h2">Gallery</Heading>
            <input type="file" accept="image/*" multiple onChange={addGalleryImage} className="hidden" id="gallery-upload" />
            <Button variant="secondary" size="small" onClick={() => document.getElementById("gallery-upload")?.click()}>
              <Plus /> Add Images
            </Button>
          </div>
          {galleryImages.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {galleryImages.map((img, index) => (
                <div key={index} className="relative rounded-lg border border-ui-border-base p-2">
                  <img src={img.image_url} alt={`Gallery ${index + 1}`} className="h-24 w-full rounded object-cover" />
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <IconButton size="small" onClick={() => moveGalleryImage(index, "up")} disabled={index === 0}>
                        <ArrowUpMini />
                      </IconButton>
                      <IconButton size="small" onClick={() => moveGalleryImage(index, "down")} disabled={index === galleryImages.length - 1}>
                        <ArrowDownMini />
                      </IconButton>
                    </div>
                    <IconButton size="small" onClick={() => removeGalleryImage(index)}>
                      <Trash />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          )}
          {galleryImages.length === 0 && <Text className="text-ui-fg-subtle">No gallery images added</Text>}
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Edit Project",
})

export default ProjectEditPage
