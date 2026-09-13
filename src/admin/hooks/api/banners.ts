import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type Banner = {
  id: string
  image_url: string
  type: "hero" | "mobile_hero" | "past_customer" | "partners"
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export type CreateBannerInput = {
  image_url: string
  type?: "hero" | "mobile_hero" | "past_customer" | "partners"
  is_active?: boolean
  display_order?: number
}

export type UpdateBannerInput = Partial<CreateBannerInput> & { id: string }

export const useBanners = () => {
  return useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const response = await fetch("/admin/banners")
      if (!response.ok) throw new Error("Failed to fetch banners")
      return response.json() as Promise<{ banners: Banner[] }>
    },
  })
}

export const useBanner = (id: string) => {
  return useQuery({
    queryKey: ["banner", id],
    queryFn: async () => {
      const response = await fetch(`/admin/banners/${id}`)
      if (!response.ok) throw new Error("Failed to fetch banner")
      return response.json() as Promise<{ banner: Banner }>
    },
    enabled: !!id,
  })
}

export const useCreateBanner = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateBannerInput) => {
      const response = await fetch("/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!response.ok) throw new Error("Failed to create banner")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] })
    },
  })
}

export const useUpdateBanner = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<CreateBannerInput>) => {
      const response = await fetch(`/admin/banners/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!response.ok) throw new Error("Failed to update banner")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] })
      queryClient.invalidateQueries({ queryKey: ["banner", id] })
    },
  })
}

export const useDeleteBanner = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/admin/banners/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete banner")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] })
    },
  })
}
