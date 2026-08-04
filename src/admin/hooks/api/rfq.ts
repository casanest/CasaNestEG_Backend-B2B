import { useQuery } from "@tanstack/react-query"

export const useRfqs = (query: { limit?: number; offset?: number } = {}) => {
  const queryParams = new URLSearchParams()
  if (query.limit) queryParams.append('limit', query.limit.toString())
  if (query.offset) queryParams.append('offset', query.offset.toString())
  
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
