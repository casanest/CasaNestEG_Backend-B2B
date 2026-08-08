import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Select, Table, Text } from "@medusajs/ui"
import { useAppointments, type AppointmentDateField } from "../../hooks/api/appointments"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

interface Appointment {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  status: string
  created_at: string
  appointment_date: string | null
}

const DATE_FIELD_OPTIONS: { value: AppointmentDateField; label: string }[] = [
  { value: "created_at", label: "Request date" },
  { value: "appointment_date", label: "Scheduled date" },
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
  const [dateField, setDateField] = useState<AppointmentDateField>("created_at")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const { data, isLoading, error } = useAppointments({
    limit,
    offset,
    from: from || undefined,
    to: to || undefined,
    date_field: dateField,
  })

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

  const handleClear = () => {
    setFrom("")
    setTo("")
    setDateField("created_at")
    setOffset(0)
  }

  const filters = (
    <div className="mt-4 flex flex-wrap items-end gap-3">
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

      <Button variant="secondary" onClick={handleClear}>
        Clear
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
              <Table.HeaderCell>Customer</Table.HeaderCell>
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
                <Table.Cell>{appointment.customer_name}</Table.Cell>
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
