import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Checkbox, Container, Heading, Input, Select, Table, Text, toast } from "@medusajs/ui"
import { useAppointments, useDeleteAppointments, type AppointmentDateField, type AppointmentStatus, type AppointmentSortBy, type AppointmentSortOrder } from "../../hooks/api/appointments"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Trash } from "@medusajs/icons"

interface Appointment {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  company_name: string | null
  subject: string | null
  status: string
  created_at: string
  appointment_date: string | null
}

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "contacted", label: "Contacted" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

const DATE_FIELD_OPTIONS: { value: AppointmentDateField; label: string }[] = [
  { value: "created_at", label: "Request date" },
  { value: "appointment_date", label: "Scheduled date" },
]

const SORT_BY_OPTIONS: { value: AppointmentSortBy; label: string }[] = [
  { value: "customer_name", label: "Name" },
  { value: "created_at", label: "Date" },
  { value: "status", label: "State" },
]

const SORT_ORDER_OPTIONS: { value: AppointmentSortOrder; label: string }[] = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-orange-500'
    case 'contacted':
      return 'bg-blue-500'
    case 'scheduled':
      return 'bg-purple-500'
    case 'completed':
      return 'bg-green-500'
    case 'cancelled':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

const PAGE_SIZE = 20

const AppointmentsPage = () => {
  const navigate = useNavigate()
  const [limit] = useState(PAGE_SIZE)
  const [offset, setOffset] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateField, setDateField] = useState<AppointmentDateField>("created_at")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [sortBy, setSortBy] = useState<AppointmentSortBy>("created_at")
  const [sortOrder, setSortOrder] = useState<AppointmentSortOrder>("desc")
  const { data, isLoading, error } = useAppointments({
    limit,
    offset,
    status: (statusFilter !== "all" ? statusFilter : undefined) as AppointmentStatus | undefined,
    from: from || undefined,
    to: to || undefined,
    date_field: dateField,
    sort_by: sortBy,
    sort_order: sortOrder,
  })
  const { mutateAsync: deleteAppointments, isPending: isDeleting } = useDeleteAppointments()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const pageAppointments: Appointment[] = data?.appointments ?? []
  const pageIds = pageAppointments.map((a) => a.id)
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
    if (!confirm(`Delete ${ids.length} appointment${ids.length === 1 ? "" : "s"}?`)) return
    try {
      await deleteAppointments(ids)
      setSelected(new Set())
      toast.success(`${ids.length} appointment${ids.length === 1 ? "" : "s"} deleted`)
      if (selectedOnPage.length === pageIds.length && offset > 0) {
        setOffset(Math.max(0, offset - limit))
      }
    } catch {
      toast.error("Failed to delete appointments")
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

  // changing a filter invalidates the current page, so go back to the first one
  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setOffset(0)
  }

  const handleDateFieldChange = (value: AppointmentDateField) => {
    setDateField(value)
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

  const handleSortByChange = (value: AppointmentSortBy) => {
    setSortBy(value)
    setOffset(0)
  }

  const handleSortOrderChange = (value: AppointmentSortOrder) => {
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
    setDateField("created_at")
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
        <Text className="font-medium mb-1">Filter by</Text>
        <Select
          value={dateField}
          onValueChange={(value) =>
            handleDateFieldChange(value as AppointmentDateField)
          }
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            {DATE_FIELD_OPTIONS.map((option) => (
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
        <Select value={sortBy} onValueChange={(v) => handleSortByChange(v as AppointmentSortBy)}>
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
        <Select value={sortOrder} onValueChange={(v) => handleSortOrderChange(v as AppointmentSortOrder)}>
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
        <Heading level="h1">Appointments</Heading>
        {filters}
        <div className="mt-4">Loading...</div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Heading level="h1">Appointments</Heading>
        {filters}
        <div className="mt-4 text-red-500">Error loading appointments</div>
      </Container>
    )
  }

  return (
    <Container>
      <Heading level="h1">Appointments</Heading>

      {filters}

      {dateField === "appointment_date" && (from || to) && (
        <Text className="mt-2 text-ui-fg-subtle text-sm">
          Appointments without a scheduled date are excluded from this range.
        </Text>
      )}

      <div className="mt-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className="w-[40px]">
                <Checkbox
                  checked={allPageSelected ? true : somePageSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAllOnPage}
                  aria-label="Select all appointments on this page"
                />
              </Table.HeaderCell>
              <Table.HeaderCell>Customer</Table.HeaderCell>
              <Table.HeaderCell>Company</Table.HeaderCell>
              <Table.HeaderCell>Subject</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Phone</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Created At</Table.HeaderCell>
              <Table.HeaderCell>Scheduled Date</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data?.appointments?.map((appointment: Appointment) => (
              <Table.Row
                key={appointment.id}
                className="cursor-pointer"
                onClick={() => navigate(`/appointments/${appointment.id}`)}
              >
                <Table.Cell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(appointment.id)}
                    onCheckedChange={() => toggleOne(appointment.id)}
                    aria-label={`Select appointment ${appointment.customer_name}`}
                  />
                </Table.Cell>
                <Table.Cell>{appointment.customer_name}</Table.Cell>
                <Table.Cell>{appointment.company_name || '-'}</Table.Cell>
                <Table.Cell>{appointment.subject || '-'}</Table.Cell>
                <Table.Cell>{appointment.customer_email}</Table.Cell>
                <Table.Cell>{appointment.customer_phone}</Table.Cell>
                <Table.Cell>
                  <span className={`inline-block px-2 py-1 rounded text-white text-xs ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </Table.Cell>
                <Table.Cell>{formatDate(appointment.created_at)}</Table.Cell>
                <Table.Cell>
                  {appointment.appointment_date
                    ? formatDate(appointment.appointment_date)
                    : '—'}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>

        {data?.appointments?.length === 0 && (
          <div className="mt-4 text-center text-gray-500">No appointments found</div>
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
  label: "Appointments",
})

export default AppointmentsPage
