import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type RfqStatus = "pending" | "quoted" | "closed" | "done"
export type RfqSortBy = "customer_name" | "created_at" | "status"
export type RfqSortOrder = "asc" | "desc"

export type RfqsQuery = {
  limit?: number
  offset?: number
  status?: RfqStatus
  from?: string
  to?: string
  sort_by?: RfqSortBy
  sort_order?: RfqSortOrder
}

export const useRfqs = (query: RfqsQuery = {}) => {
  const queryParams = new URLSearchParams()
  if (query.limit) queryParams.append('limit', query.limit.toString())
  if (query.offset) queryParams.append('offset', query.offset.toString())
  if (query.status) queryParams.append('status', query.status)
  if (query.from) queryParams.append('from', query.from)
  if (query.to) queryParams.append('to', query.to)
  if (query.sort_by) queryParams.append('sort_by', query.sort_by)
  if (query.sort_order) queryParams.append('sort_order', query.sort_order)
  if (query.from || query.to) {
    queryParams.append('tz_offset', new Date().getTimezoneOffset().toString())
  }

  return useQuery({
    queryKey: ['rfqs', query],
    queryFn: async () => {
      const response = await fetch(`/admin/rfq?${queryParams.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch RFQs')
      }
      return response.json()
    },
  })
}

export const useRfq = (id: string) => {
  return useQuery({
    queryKey: ['rfq', id],
    queryFn: async () => {
      const response = await fetch(`/admin/rfq/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch RFQ')
      }
      return response.json()
    },
  })
}

export const useRfqAttachments = (id: string) => {
  return useQuery({
    queryKey: ['rfq_attachments', id],
    queryFn: async () => {
      const response = await fetch(`/admin/rfq/${id}/attachments`)
      if (!response.ok) {
        throw new Error('Failed to fetch RFQ attachments')
      }
      return response.json()
    },
  })
}

export type UpdateRfqPayload = {
  status?: RfqStatus
}

export const useUpdateRfq = (id: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateRfqPayload) => {
      const response = await fetch(`/admin/rfq/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error('Failed to update RFQ')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfq', id] })
      queryClient.invalidateQueries({ queryKey: ['rfqs'] })
    },
  })
}

export const useRfqComments = (id: string) => {
  return useQuery({
    queryKey: ['rfq_comments', id],
    queryFn: async () => {
      const response = await fetch(`/admin/rfq/${id}/comments`)
      if (!response.ok) {
        throw new Error('Failed to fetch RFQ comments')
      }
      return response.json()
    },
  })
}

export type CreateRfqCommentPayload = {
  body: string
  author?: string
}

export const useCreateRfqComment = (id: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateRfqCommentPayload) => {
      const response = await fetch(`/admin/rfq/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error('Failed to add comment')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfq_comments', id] })
    },
  })
}
