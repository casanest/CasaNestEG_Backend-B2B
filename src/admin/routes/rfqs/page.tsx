import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Checkbox, Container, Heading, Input, Select, Table, Text, toast } from "@medusajs/ui"
import { useRfqs, useDeleteRfqs, type RfqStatus, type RfqSortBy, type RfqSortOrder } from "../../hooks/api/rfq"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Trash } from "@medusajs/icons"

interface Rfq {
  id: string
  customer_name: string
  company_name: string | null
  customer_email: string
  status: string
  created_at: string
  items_count: number
}

const STATUS_OPTIONS: { value: RfqStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "quoted", label: "Quoted" },
  { value: "closed", label: "Closed" },
  { value: "done", label: "Done" },
]

const SORT_BY_OPTIONS: { value: RfqSortBy; label: string }[] = [
  { value: "customer_name", label: "Name" },
  { value: "created_at", label: "Date" },
  { value: "status", label: "State" },
]

const SORT_ORDER_OPTIONS: { value: RfqSortOrder; label: string }[] = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-orange-500'
    case 'quoted':
      return 'bg-blue-500'
    case 'closed':
      return 'bg-green-500'
    case 'done':
      return 'bg-purple-500'
    default:
      return 'bg-gray-500'
  }
}

const PAGE_SIZE = 20

const RfqsPage = () => {
  const navigate = useNavigate()
  const [limit] = useState(PAGE_SIZE)
  const [offset, setOffset] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [sortBy, setSortBy] = useState<RfqSortBy>("created_at")
  const [sortOrder, setSortOrder] = useState<RfqSortOrder>("desc")
  const { data, isLoading, error } = useRfqs({
    limit,
    offset,
    status: (statusFilter !== "all" ? statusFilter : undefined) as RfqStatus | undefined,
    from: from || undefined,
    to: to || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
  })
  const { mutateAsync: deleteRfqs, isPending: isDeleting } = useDeleteRfqs()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const pageRfqs: Rfq[] = data?.rfqs ?? []
  const pageIds = pageRfqs.map((r) => r.id)
  const selectedOnPage = pageIds.filter((id) => selected.has(id))
  const allPageSelected = pageIds.length > 0 && selectedOnPage.length === pageIds.length
  const somePageSelected = selectedOnPage.length > 0 && !allPageSelected

  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id))
      } else {
        pageIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleDeleteSelected = async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    if (!confirm(`Delete ${ids.length} RFQ${ids.length === 1 ? "" : "s"}?`)) return
    try {
      await deleteRfqs(ids)
      setSelected(new Set())
      toast.success(`${ids.length} RFQ${ids.length === 1 ? "" : "s"} deleted`)
      if (selectedOnPage.length === pageIds.length && offset > 0) {
        setOffset(Math.max(0, offset - limit))
      }
    } catch {
      toast.error("Failed to delete RFQs")
    }
  }

  const count: number = data?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(count / limit))
  const currentPage = Math.floor(offset / limit) + 1
  const canPrev = offset > 0
  const canNext = offset + limit < count

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setOffset(0)
  }

  const handleFromChange = (value: string) => {
    setFrom(value)
    setOffset(0)
  }

  const handleToChange = (value: string) => {
    setTo(value)
    setOffset(0)
  }

  const handleSortByChange = (value: RfqSortBy) => {
    setSortBy(value)
    setOffset(0)
  }

  const handleSortOrderChange = (value: RfqSortOrder) => {
    setSortOrder(value)
    setOffset(0)
  }

  const handleToday = () => {
    const today = new Date().toISOString().slice(0, 10)
    setFrom(today)
    setTo(today)
    setOffset(0)
  }

  const handleClear = () => {
    setFrom("")
    setTo("")
    setStatusFilter("all")
    setSortBy("created_at")
    setSortOrder("desc")
    setOffset(0)
  }

  const filters = (
    <div className="mt-4 flex flex-wrap items-end gap-3">
      <div>
        <Text className="font-medium mb-1">Status</Text>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <Select.Trigger>
            <Select.Value placeholder="All" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All</Select.Item>
            {STATUS_OPTIONS.map((option) => (
              <Select.Item key={option.value} value={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      <div>
        <Text className="font-medium mb-1">From</Text>
        <Input
          type="date"
          value={from}
          onChange={(e) => handleFromChange(e.target.value)}
        />
      </div>

      <div>
        <Text className="font-medium mb-1">To</Text>
        <Input
          type="date"
          value={to}
          onChange={(e) => handleToChange(e.target.value)}
        />
      </div>

      <div>
        <Text className="font-medium mb-1">Sort by</Text>
        <Select value={sortBy} onValueChange={(v) => handleSortByChange(v as RfqSortBy)}>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            {SORT_BY_OPTIONS.map((option) => (
              <Select.Item key={option.value} value={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      <div>
        <Text className="font-medium mb-1">Order</Text>
        <Select value={sortOrder} onValueChange={(v) => handleSortOrderChange(v as RfqSortOrder)}>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            {SORT_ORDER_OPTIONS.map((option) => (
              <Select.Item key={option.value} value={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      <Button variant="secondary" onClick={handleToday}>
        Today
      </Button>

      <Button variant="secondary" onClick={handleClear}>
        Clear
      </Button>

      <Button
        variant="danger"
        onClick={handleDeleteSelected}
        disabled={selected.size === 0}
        isLoading={isDeleting}
      >
        <Trash /> Delete selected{selected.size > 0 ? ` (${selected.size})` : ""}
      </Button>
    </div>
  )

  if (isLoading) {
    return (
      <Container>
        <Heading level="h1">RFQs</Heading>
        {filters}
        <div className="mt-4">Loading...</div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Heading level="h1">RFQs</Heading>
        {filters}
        <div className="mt-4 text-red-500">Error loading RFQs</div>
      </Container>
    )
  }

  return (
    <Container>
      <Heading level="h1">RFQs</Heading>

      {filters}

      <div className="mt-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className="w-[40px]">
                <Checkbox
                  checked={allPageSelected ? true : somePageSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAllOnPage}
                  aria-label="Select all RFQs on this page"
                />
              </Table.HeaderCell>
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
                <Table.Cell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(rfq.id)}
                    onCheckedChange={() => toggleOne(rfq.id)}
                    aria-label={`Select RFQ ${rfq.customer_name}`}
                  />
                </Table.Cell>
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

        {count > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <Text className="text-ui-fg-subtle text-sm">
              {offset + 1}–{Math.min(offset + limit, count)} of {count}
            </Text>
            <div className="flex items-center gap-2">
              <Text className="text-ui-fg-subtle text-sm">
                Page {currentPage} of {pageCount}
              </Text>
              <Button
                variant="secondary"
                disabled={!canPrev}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={!canNext}
                onClick={() => setOffset(offset + limit)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "RFQs",
})

export default RfqsPage
