import { Container, Heading, Text, Button } from "@medusajs/ui"
import { useRfq } from "../../../hooks/api/rfq"
import { useParams, useNavigate } from "react-router-dom"

interface RfqItem {
  product_title: string
  quantity: number
}

interface Rfq {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  company_name: string | null
  message: string
  status: string
  created_at: string
  items: RfqItem[]
}

const RfqDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, error } = useRfq(id || '')

  if (isLoading) {
    return (
      <Container>
        <Heading level="h1">RFQ Details</Heading>
        <div className="mt-4">Loading...</div>
      </Container>
    )
  }

  if (error || !data?.rfq) {
    return (
      <Container>
        <Heading level="h1">RFQ Details</Heading>
        <div className="mt-4 text-red-500">Error loading RFQ</div>
      </Container>
    )
  }

  const rfq: Rfq = data.rfq

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

  return (
    <Container>
      <div className="flex items-center justify-between mb-4">
        <Heading level="h1">RFQ Details</Heading>
        <Button variant="secondary" onClick={() => navigate('/app/rfqs')}>
          Back to RFQs
        </Button>
      </div>

      <div className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-block px-3 py-1 rounded text-white text-sm ${getStatusColor(rfq.status)}`}>
            {rfq.status.toUpperCase()}
          </span>
          <Text className="text-ui-fg-subtle text-sm">
            Created: {new Date(rfq.created_at).toLocaleString()}
          </Text>
        </div>

        {/* Customer Block */}
        <div className="border rounded-lg p-4">
          <Heading level="h2" className="mb-3">Customer Information</Heading>
          <div className="space-y-2">
            <div>
              <Text className="font-medium">Name:</Text>
              <Text className="ml-2">{rfq.customer_name}</Text>
            </div>
            <div>
              <Text className="font-medium">Company:</Text>
              <Text className="ml-2">{rfq.company_name || '-'}</Text>
            </div>
            <div>
              <Text className="font-medium">Email:</Text>
              <Text className="ml-2">{rfq.customer_email}</Text>
            </div>
            <div>
              <Text className="font-medium">Phone:</Text>
              <Text className="ml-2">{rfq.customer_phone}</Text>
            </div>
          </div>
        </div>

        {/* Message Block */}
        <div className="border rounded-lg p-4">
          <Heading level="h2" className="mb-3">Message</Heading>
          <Text className="whitespace-pre-wrap">{rfq.message}</Text>
        </div>

        {/* Items Block */}
        <div className="border rounded-lg p-4">
          <Heading level="h2" className="mb-3">Items</Heading>
          {rfq.items && rfq.items.length > 0 ? (
            <div className="space-y-2">
              {rfq.items.map((item, index) => (
                <div key={index} className="border-b last:border-0 pb-2 last:pb-0">
                  <Text>
                    {item.product_title}: {item.quantity}
                  </Text>
                </div>
              ))}
            </div>
          ) : (
            <Text className="text-ui-fg-subtle">No items</Text>
          )}
        </div>
      </div>
    </Container>
  )
}

export default RfqDetailPage
