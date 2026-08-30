import { Container, Heading, Text, Button, Table } from "@medusajs/ui"
import { useRfq, useRfqAttachments } from "../../../hooks/api/rfq"
import { useParams, useNavigate } from "react-router-dom"

interface RfqItem {
  product_id: string
  product_title: string
  quantity: number
  variant_info: string | null
  variant_title: string | null
  variant_sku: string | null
  product_handle: string | null
  thumbnail: string | null
}

interface Rfq {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  company_name: string | null
  city: string | null
  address: string | null
  message: string
  status: string
  created_at: string
  items: RfqItem[]
}

const RfqDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, error } = useRfq(id || '')
  const { data: attData, isLoading: attLoading } = useRfqAttachments(id || '')

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
        <Button variant="secondary" onClick={() => navigate('/rfqs')}>
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
            <div>
              <Text className="font-medium">City:</Text>
              <Text className="ml-2">{rfq.city || '-'}</Text>
            </div>
            <div>
              <Text className="font-medium">Address:</Text>
              <Text className="ml-2">{rfq.address || '-'}</Text>
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
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Product</Table.HeaderCell>
                  <Table.HeaderCell className="w-[140px]">Code</Table.HeaderCell>
                  <Table.HeaderCell className="w-[80px] text-right">Qty</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {rfq.items.map((item, index) => {
                  const isDefaultVariant =
                    !item.variant_info ||
                    (item.variant_title && item.variant_title.toLowerCase() === 'default')
                  return (
                    <Table.Row key={index}>
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.product_title}
                              className="w-10 h-10 rounded object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-ui-bg-subtle shrink-0" />
                          )}
                          <div className="flex flex-col">
                            <span
                              className="text-ui-fg-interactive hover:underline cursor-pointer font-medium"
                              onClick={() => navigate(`/products/${item.product_id}`)}
                            >
                              {item.product_title}
                            </span>
                            {!isDefaultVariant && item.variant_info && (
                              <span className="text-ui-fg-subtle text-sm">({item.variant_info})</span>
                            )}
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Text className="font-mono text-sm">{item.variant_sku || '-'}</Text>
                      </Table.Cell>
                      <Table.Cell className="text-right font-medium">
                        {item.quantity}
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table>
          ) : (
            <Text className="text-ui-fg-subtle">No items</Text>
          )}
        </div>

        {/* Attachments Block */}
        <div className="border rounded-lg p-4">
          <Heading level="h2" className="mb-3">Attachments</Heading>
          {attLoading ? (
            <Text className="text-ui-fg-subtle">Loading attachments...</Text>
          ) : attData?.attachments && attData.attachments.length > 0 ? (
            <div className="space-y-3">
              {attData.attachments.map((att: any) => (
                <div key={att.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                  <div className="flex flex-col">
                    <Text className="font-medium">{att.file_name}</Text>
                    <Text className="text-xs text-ui-fg-subtle">{(att.size / 1024).toFixed(1)} KB - {att.mime_type}</Text>
                  </div>
                  <Button variant="secondary" size="small" onClick={() => window.open(att.url, '_blank')}>
                    View / Download
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <Text className="text-ui-fg-subtle">No attachments included.</Text>
          )}
        </div>
      </div>
    </Container>
  )
}

export default RfqDetailPage
