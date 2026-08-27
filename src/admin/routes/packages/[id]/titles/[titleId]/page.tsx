import { Container, Heading, Input, Text, Button, Table, IconButton, toast, Checkbox } from "@medusajs/ui"
import {
  usePackageTitle,
  useUpdateTitle,
  useAttachProducts,
  useDetachProducts,
  type PackageTitleProduct,
} from "../../../../../hooks/api/packages"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect, useCallback } from "react"
import { Trash, ArrowLeft } from "@medusajs/icons"

type AdminProduct = {
  id: string
  title: string
  thumbnail: string | null
  status: string
  handle: string
}

const TitleDetailPage = () => {
  const { id: packageId, titleId } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = usePackageTitle(titleId ?? "")
  const updateTitle = useUpdateTitle(titleId ?? "")
  const attachProducts = useAttachProducts(titleId ?? "")
  const detachProducts = useDetachProducts(titleId ?? "")

  const [nameEn, setNameEn] = useState("")
  const [nameAr, setNameAr] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<AdminProduct[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const [originalProductIds, setOriginalProductIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (data?.title) {
      setNameEn(data.title.name_en)
      setNameAr(data.title.name_ar)
      const ids = new Set((data.title.products ?? []).map((p: PackageTitleProduct) => p.id))
      setSelectedProductIds(ids)
      setOriginalProductIds(ids)
    }
  }, [data])

  const debouncedSearch = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>
      return (query: string) => {
        clearTimeout(timer)
        timer = setTimeout(async () => {
          if (!query.trim()) {
            setSearchResults([])
            return
          }
          setSearching(true)
          try {
            const response = await fetch(
              `/admin/products?q=${encodeURIComponent(query)}&limit=20&offset=0`
            )
            if (!response.ok) throw new Error("Search failed")
            const result = await response.json()
            setSearchResults(result.products ?? [])
          } catch (e) {
            toast.error("Failed to search products")
          } finally {
            setSearching(false)
          }
        }, 300)
      }
    })(),
    []
  )

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    debouncedSearch(query)
  }

  const toggleProduct = (productId: string) => {
    const next = new Set(selectedProductIds)
    if (next.has(productId)) {
      next.delete(productId)
    } else {
      next.add(productId)
    }
    setSelectedProductIds(next)
  }

  const handleSaveProducts = async () => {
    const toAttach = [...selectedProductIds].filter((id) => !originalProductIds.has(id))
    const toDetach = [...originalProductIds].filter((id) => !selectedProductIds.has(id))

    if (toAttach.length === 0 && toDetach.length === 0) {
      toast.info("No changes to save")
      return
    }

    try {
      if (toAttach.length > 0) {
        await attachProducts.mutateAsync(toAttach)
      }
      if (toDetach.length > 0) {
        await detachProducts.mutateAsync(toDetach)
      }
      toast.success("Products updated")
      setOriginalProductIds(new Set(selectedProductIds))
    } catch (e) {
      toast.error("Failed to update products")
    }
  }

  const handleSaveTitle = async () => {
    if (!nameEn || !nameAr) {
      toast.error("Both names are required")
      return
    }
    try {
      await updateTitle.mutateAsync({ name_en: nameEn, name_ar: nameAr })
      toast.success("Title updated")
    } catch (e) {
      toast.error("Failed to update title")
    }
  }

  const handleRemoveProduct = async (productId: string) => {
    try {
      await detachProducts.mutateAsync([productId])
      const next = new Set(selectedProductIds)
      next.delete(productId)
      setSelectedProductIds(next)
      const nextOriginal = new Set(originalProductIds)
      nextOriginal.delete(productId)
      setOriginalProductIds(nextOriginal)
      toast.success("Product removed")
    } catch (e) {
      toast.error("Failed to remove product")
    }
  }

  if (isLoading) {
    return <Container><Heading level="h1">Loading...</Heading></Container>
  }

  if (error || !data?.title) {
    return <Container><Heading level="h1">Title not found</Heading></Container>
  }

  const title = data.title
  const attachedProducts = title.products ?? []

  return (
    <Container>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconButton size="small" onClick={() => navigate(`/packages/${packageId}`)}>
            <ArrowLeft />
          </IconButton>
          <Heading level="h1">{title.name_en}</Heading>
        </div>
      </div>

      {/* Rename section */}
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
          <Button onClick={handleSaveTitle} isLoading={updateTitle.isPending}>
            Save Title
          </Button>
        </div>
      </div>

      {/* Attached products summary */}
      <div className="mt-8">
        <Heading level="h2">Attached Products ({attachedProducts.length})</Heading>
        {attachedProducts.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {attachedProducts.map((product: PackageTitleProduct) => (
              <div
                key={product.id}
                className="flex items-center gap-2 rounded-lg border p-2"
              >
                {product.thumbnail && (
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="h-8 w-8 rounded object-cover"
                  />
                )}
                <Text size="small">{product.title}</Text>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveProduct(product.id)}
                >
                  <Trash />
                </IconButton>
              </div>
            ))}
          </div>
        )}
        {attachedProducts.length === 0 && (
          <div className="mt-4 text-ui-fg-subtle">No products attached yet</div>
        )}
      </div>

      {/* Product picker */}
      <div className="mt-8">
        <Heading level="h2">Add Products</Heading>
        <div className="mt-4">
          <Input
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search products by name..."
          />
        </div>

        {searching && (
          <div className="mt-4 text-ui-fg-subtle">Searching...</div>
        )}

        {searchResults.length > 0 && (
          <div className="mt-4">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell></Table.HeaderCell>
                  <Table.HeaderCell>Thumbnail</Table.HeaderCell>
                  <Table.HeaderCell>Title</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {searchResults.map((product) => (
                  <Table.Row key={product.id}>
                    <Table.Cell>
                      <Checkbox
                        checked={selectedProductIds.has(product.id)}
                        onCheckedChange={() => toggleProduct(product.id)}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-ui-bg-subtle" />
                      )}
                    </Table.Cell>
                    <Table.Cell>{product.title}</Table.Cell>
                    <Table.Cell>{product.status}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}

        {searchQuery && searchResults.length === 0 && !searching && (
          <div className="mt-4 text-ui-fg-subtle">No products found</div>
        )}

        <div className="mt-4">
          <Button
            onClick={handleSaveProducts}
            isLoading={attachProducts.isPending || detachProducts.isPending}
          >
            Save Product Selection
          </Button>
        </div>
      </div>
    </Container>
  )
}

export default TitleDetailPage
