import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type PortfolioCategory = {
  id: string
  slug: string
  name_en: string
  name_ar: string
  created_at: string
  updated_at: string
}

export type PortfolioProject = {
  id: string
  category_id: string
  slug: string
  title_en: string
  title_ar: string
  location_en: string
  location_ar: string
  hero_image_url: string
  project_date: string
  is_in_homepage: boolean
  created_at: string
  updated_at: string
}

export type PortfolioMetric = {
  id?: string
  label_en: string
  label_ar: string
  value_en: string
  value_ar: string
  display_order: number
}

export type PortfolioSubParagraph = {
  id?: string
  heading_en: string
  heading_ar: string
  text_en: string
  text_ar: string
  image_url?: string | null
  display_order: number
}

export type PortfolioGalleryImage = {
  id?: string
  image_url: string
  display_order: number
}

export type PortfolioProjectDetail = PortfolioProject & {
  metrics: PortfolioMetric[]
  sub_paragraphs: PortfolioSubParagraph[]
  gallery_images: PortfolioGalleryImage[]
}

export type CreateCategoryInput = {
  slug: string
  name_en: string
  name_ar: string
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>

export type CreateProjectInput = {
  category_id: string
  slug: string
  title_en: string
  title_ar: string
  location_en: string
  location_ar: string
  hero_image_url: string
  project_date: string
  is_in_homepage?: boolean
  metrics?: PortfolioMetric[]
  sub_paragraphs?: PortfolioSubParagraph[]
  gallery_images?: PortfolioGalleryImage[]
}

export type UpdateProjectInput = Partial<CreateProjectInput> & { id: string }

export const usePortfolioCategories = () => {
  return useQuery({
    queryKey: ["portfolio-categories"],
    queryFn: async () => {
      const response = await fetch("/admin/portfolio/categories")
      if (!response.ok) throw new Error("Failed to fetch categories")
      return response.json() as Promise<{ categories: PortfolioCategory[] }>
    },
  })
}

export const usePortfolioCategory = (id: string) => {
  return useQuery({
    queryKey: ["portfolio-category", id],
    queryFn: async () => {
      const response = await fetch(`/admin/portfolio/categories/${id}`)
      if (!response.ok) throw new Error("Failed to fetch category")
      return response.json() as Promise<{ category: PortfolioCategory }>
    },
    enabled: !!id,
  })
}

export const useCreateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const response = await fetch("/admin/portfolio/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!response.ok) throw new Error("Failed to create category")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-categories"] })
    },
  })
}

export const useUpdateCategory = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateCategoryInput) => {
      const response = await fetch(`/admin/portfolio/categories/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!response.ok) throw new Error("Failed to update category")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-categories"] })
      queryClient.invalidateQueries({ queryKey: ["portfolio-category", id] })
    },
  })
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/admin/portfolio/categories/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete category")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-categories"] })
    },
  })
}

export const usePortfolioProjects = (categoryId: string) => {
  return useQuery({
    queryKey: ["portfolio-projects", categoryId],
    queryFn: async () => {
      const response = await fetch(
        `/admin/portfolio/categories/${categoryId}/projects`
      )
      if (!response.ok) throw new Error("Failed to fetch projects")
      return response.json() as Promise<{ projects: PortfolioProject[] }>
    },
    enabled: !!categoryId,
  })
}

export const usePortfolioProject = (id: string) => {
  return useQuery({
    queryKey: ["portfolio-project", id],
    queryFn: async () => {
      const response = await fetch(`/admin/portfolio/projects/${id}`)
      if (!response.ok) throw new Error("Failed to fetch project")
      return response.json() as Promise<{ project: PortfolioProjectDetail }>
    },
    enabled: !!id,
  })
}

export const useCreateProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const response = await fetch("/admin/portfolio/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!response.ok) throw new Error("Failed to create project")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-projects"] })
    },
  })
}

export const useUpdateProject = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<CreateProjectInput>) => {
      const response = await fetch(`/admin/portfolio/projects/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!response.ok) throw new Error("Failed to update project")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-projects"] })
      queryClient.invalidateQueries({ queryKey: ["portfolio-project", id] })
    },
  })
}

export const useDeleteProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/admin/portfolio/projects/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete project")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-projects"] })
    },
  })
}
