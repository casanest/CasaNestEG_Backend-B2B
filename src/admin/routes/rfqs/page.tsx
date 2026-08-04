import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Table } from "@medusajs/ui"
import { useRfqs } from "../../hooks/api/rfq"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

interface Rfq {
  id: string
  customer_name: string
  company_name: string | null
  customer_email: string
  status: string
  created_at: string
  items_count: number
}

const RfqsPage = () => {
  const navigate = useNavigate()
  const [limit] = useState(20)
  const [offset] = useState(0)
  const { data, isLoading, error } = useRfqs({ limit, offset })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-500'
      case 'quoted':
        return 'bg-blue-500'
      case 'closed':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (isLoading) {
    return (
      <Container>
        <Heading level="h1">RFQs</Heading>
        <div className="mt-4">Loading...</div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Heading level="h1">RFQs</Heading>
        <div className="mt-4 text-red-500">Error loading RFQs</div>
      </Container>
    )
  }

  return (
    <Container>
      <Heading level="h1">RFQs</Heading>
      
      <div className="mt-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Customer Name</Table.HeaderCell>
              <Table.HeaderCell>Company</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Items</Table.HeaderCell>
              <Table.HeaderCell>Created</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data?.rfqs?.map((rfq: Rfq) => (
              <Table.Row 
                key={rfq.id}
                className="cursor-pointer"
                onClick={() => navigate(`/rfqs/${rfq.id}`)}
              >
                <Table.Cell>{rfq.customer_name}</Table.Cell>
                <Table.Cell>{rfq.company_name || '-'}</Table.Cell>
                <Table.Cell>{rfq.customer_email}</Table.Cell>
                <Table.Cell>
                  <span className={`inline-block px-2 py-1 rounded text-white text-xs ${getStatusColor(rfq.status)}`}>
                    {rfq.status}
                  </span>
                </Table.Cell>
                <Table.Cell>{rfq.items_count}</Table.Cell>
                <Table.Cell>{formatDate(rfq.created_at)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        
        {data?.rfqs?.length === 0 && (
          <div className="mt-4 text-center text-gray-500">No RFQs found</div>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "RFQs",
})

export default RfqsPage
