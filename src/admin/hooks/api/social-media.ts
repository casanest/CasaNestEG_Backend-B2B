import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type SocialMedia = {
  id: string
  platform: string
  url: string
  label: string | null
  description: string | null
  display_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export type CreateSocialMediaInput = {
  platform: string
  url: string
  label?: string | null
  description?: string | null
  display_order?: number
  is_published?: boolean
}

export type UpdateSocialMediaInput = Partial<CreateSocialMediaInput> & { id: string }

export const PLATFORM_OPTIONS = [
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "X (Twitter)" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "snapchat", label: "Snapchat" },
  { value: "pinterest", label: "Pinterest" },
]

export const useSocialMedia = () => {
  return useQuery({
    queryKey: ["socialMedia"],
    queryFn: async () => {
      const response = await fetch("/admin/social-media")
      if (!response.ok) throw new Error("Failed to fetch social media links")
      return response.json() as Promise<{ socialMedia: SocialMedia[] }>
    },
  })
}

export const useSocialMediaItem = (id: string) => {
  return useQuery({
    queryKey: ["socialMedia", id],
    queryFn: async () => {
      const response = await fetch(`/admin/social-media/${id}`)
      if (!response.ok) throw new Error("Failed to fetch social media link")
      return response.json() as Promise<{ socialMedia: SocialMedia }>
    },
    enabled: !!id,
  })
}

export const useCreateSocialMedia = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateSocialMediaInput) => {
      const response = await fetch("/admin/social-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!response.ok) throw new Error("Failed to create social media link")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socialMedia"] })
    },
  })
}

export const useUpdateSocialMedia = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<CreateSocialMediaInput>) => {
      const response = await fetch(`/admin/social-media/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!response.ok) throw new Error("Failed to update social media link")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socialMedia"] })
      queryClient.invalidateQueries({ queryKey: ["socialMedia", id] })
    },
  })
}

export const useDeleteSocialMedia = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/admin/social-media/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete social media link")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socialMedia"] })
    },
  })
}
