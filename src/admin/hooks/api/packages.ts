import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type Package = {
  id: string
  slug: string
  name_en: string
  name_ar: string
  description_en: string | null
  description_ar: string | null
  image_url: string | null
  is_published: boolean
  created_at: string
  updated_at: string
  titles_count?: number
}

export type PackageTitle = {
  id: string
  name_en: string
  name_ar: string
  display_order: number
  package_id: string
  created_at: string
  updated_at: string
  products?: PackageTitleProduct[]
}

export type PackageTitleProduct = {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  status: string
}

export type PackageDetail = Package & {
  titles: PackageTitle[]
}

export type CreatePackageInput = {
  slug?: string
  name_en: string
  name_ar: string
  description_en?: string | null
  description_ar?: string | null
  image_url?: string | null
  is_published?: boolean
}

export type UpdatePackageInput = Partial<CreatePackageInput> & { id: string }

export type CreateTitleInput = {
  name_en: string
  name_ar: string
}

export type UpdateTitleInput = {
  name_en?: string
  name_ar?: string
}

// ─── Package queries ───

export const usePackages = () => {
  return useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const response = await fetch("/admin/packages")
      if (!response.ok) throw new Error("Failed to fetch packages")
      return response.json() as Promise<{ packages: Package[] }>
    },
  })
}

export const usePackage = (id: string) => {
  return useQuery({
    queryKey: ["package", id],
    queryFn: async () => {
      const response = await fetch(`/admin/packages/${id}`)
      if (!response.ok) throw new Error("Failed to fetch package")
      return response.json() as Promise<{ package: PackageDetail }>
    },
    enabled: !!id,
  })
}

export const useCreatePackage = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreatePackageInput) => {
      const response = await fetch("/admin/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!response.ok) throw new Error("Failed to create package")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] })
    },
  })
}

export const useUpdatePackage = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<CreatePackageInput>) => {
      const response = await fetch(`/admin/packages/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!response.ok) throw new Error("Failed to update package")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] })
      queryClient.invalidateQueries({ queryKey: ["package", id] })
    },
  })
}

export const useDeletePackage = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/admin/packages/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete package")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] })
    },
  })
}

// ─── Title queries ───

export const usePackageTitle = (id: string) => {
  return useQuery({
    queryKey: ["package-title", id],
    queryFn: async () => {
      const response = await fetch(`/admin/package-titles/${id}`)
      if (!response.ok) throw new Error("Failed to fetch title")
      return response.json() as Promise<{ title: PackageTitle }>
    },
    enabled: !!id,
  })
}

export const useCreateTitle = (packageId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateTitleInput) => {
      const response = await fetch(`/admin/packages/${packageId}/titles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!response.ok) throw new Error("Failed to create title")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package", packageId] })
    },
  })
}

export const useUpdateTitle = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateTitleInput) => {
      const response = await fetch(`/admin/package-titles/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!response.ok) throw new Error("Failed to update title")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package-title", id] })
    },
  })
}

export const useDeleteTitle = (packageId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/admin/package-titles/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete title")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package", packageId] })
    },
  })
}

export const useReorderTitles = (packageId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (titleIds: string[]) => {
      const response = await fetch(`/admin/packages/${packageId}/titles/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title_ids: titleIds }),
      })
      if (!response.ok) throw new Error("Failed to reorder titles")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package", packageId] })
    },
  })
}

// ─── Product attach/detach ───

export const useAttachProducts = (titleId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (productIds: string[]) => {
      const response = await fetch(`/admin/package-titles/${titleId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: productIds }),
      })
      if (!response.ok) throw new Error("Failed to attach products")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package-title", titleId] })
    },
  })
}

export const useDetachProducts = (titleId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (productIds: string[]) => {
      const response = await fetch(`/admin/package-titles/${titleId}/products`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: productIds }),
      })
      if (!response.ok) throw new Error("Failed to detach products")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package-title", titleId] })
    },
  })
}
