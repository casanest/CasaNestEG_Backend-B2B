import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type Testimonial = {
  id: string
  name_en: string
  name_ar: string
  image_url: string | null
  quote_en: string
  quote_ar: string
  position_en: string
  position_ar: string
  display_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export type CreateTestimonialInput = {
  name_en: string
  name_ar: string
  image_url?: string | null
  quote_en: string
  quote_ar: string
  position_en: string
  position_ar: string
  display_order?: number
  is_published?: boolean
}

export type UpdateTestimonialInput = Partial<CreateTestimonialInput> & { id: string }

export const useTestimonials = () => {
  return useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const response = await fetch("/admin/testimonials")
      if (!response.ok) throw new Error("Failed to fetch testimonials")
      return response.json() as Promise<{ testimonials: Testimonial[] }>
    },
  })
}

export const useTestimonial = (id: string) => {
  return useQuery({
    queryKey: ["testimonial", id],
    queryFn: async () => {
      const response = await fetch(`/admin/testimonials/${id}`)
      if (!response.ok) throw new Error("Failed to fetch testimonial")
      return response.json() as Promise<{ testimonial: Testimonial }>
    },
    enabled: !!id,
  })
}

export const useCreateTestimonial = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateTestimonialInput) => {
      const response = await fetch("/admin/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!response.ok) throw new Error("Failed to create testimonial")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] })
    },
  })
}

export const useUpdateTestimonial = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<CreateTestimonialInput>) => {
      const response = await fetch(`/admin/testimonials/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!response.ok) throw new Error("Failed to update testimonial")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] })
      queryClient.invalidateQueries({ queryKey: ["testimonial", id] })
    },
  })
}

export const useDeleteTestimonial = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/admin/testimonials/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete testimonial")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] })
    },
  })
}
