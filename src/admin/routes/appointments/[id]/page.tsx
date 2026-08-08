import { Container, Heading, Text, Button, Select, Textarea, Input, toast } from "@medusajs/ui"
import { useAppointment, useUpdateAppointment } from "../../../hooks/api/appointments"
import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

interface Appointment {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address: string | null
  notes: string | null
  status: string
  admin_notes: string | null
  interview_report: string | null
  appointment_date: string | null
  created_at: string
}

const STATUS_OPTIONS = [
  "pending",
  "contacted",
  "scheduled",
  "completed",
  "cancelled",
]

// datetime-local expects "YYYY-MM-DDTHH:mm"
const toDateTimeLocal = (value: string | null) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

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

const AppointmentDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, error } = useAppointment(id || '')
  const { mutateAsync, isPending } = useUpdateAppointment(id || '')

  const [status, setStatus] = useState<string>("pending")
  const [adminNotes, setAdminNotes] = useState<string>("")
  const [interviewReport, setInterviewReport] = useState<string>("")
  const [appointmentDate, setAppointmentDate] = useState<string>("")

  const appointment: Appointment | undefined = data?.appointment

  useEffect(() => {
    if (appointment) {
      setStatus(appointment.status)
      setAdminNotes(appointment.admin_notes || "")
      setInterviewReport(appointment.interview_report || "")
      setAppointmentDate(toDateTimeLocal(appointment.appointment_date))
    }
  }, [appointment])

  const handleSave = async () => {
    try {
      await mutateAsync({
        status,
        admin_notes: adminNotes || null,
        interview_report: interviewReport || null,
        appointment_date: appointmentDate
          ? new Date(appointmentDate).toISOString()
          : null,
      })
      toast.success("Appointment updated")
    } catch (e) {
      toast.error("Failed to update appointment")
    }
  }

  if (isLoading) {
    return (
      <Container>
        <Heading level="h1">Appointment Details</Heading>
        <div className="mt-4">Loading...</div>
      </Container>
    )
  }

  if (error || !appointment) {
    return (
      <Container>
        <Heading level="h1">Appointment Details</Heading>
        <div className="mt-4 text-red-500">Error loading appointment</div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-4">
        <Heading level="h1">Appointment Details</Heading>
        <Button variant="secondary" onClick={() => navigate('/appointments')}>
          Back to Appointments
        </Button>
      </div>

      <div className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-block px-3 py-1 rounded text-white text-sm ${getStatusColor(appointment.status)}`}>
            {appointment.status.toUpperCase()}
          </span>
          <Text className="text-ui-fg-subtle text-sm">
            Created: {new Date(appointment.created_at).toLocaleString()}
          </Text>
        </div>

        {/* Customer Block */}
        <div className="border rounded-lg p-4">
          <Heading level="h2" className="mb-3">Customer Information</Heading>
          <div className="space-y-2">
            <div>
              <Text className="font-medium">Name:</Text>
              <Text className="ml-2">{appointment.customer_name}</Text>
            </div>
            <div>
              <Text className="font-medium">Email:</Text>
              <Text className="ml-2">{appointment.customer_email}</Text>
            </div>
            <div>
              <Text className="font-medium">Phone:</Text>
              <Text className="ml-2">{appointment.customer_phone}</Text>
            </div>
            <div>
              <Text className="font-medium">Address:</Text>
              <Text className="ml-2">{appointment.customer_address || '-'}</Text>
            </div>
          </div>
        </div>

        {/* Customer Notes Block */}
        <div className="border rounded-lg p-4">
          <Heading level="h2" className="mb-3">Customer Notes</Heading>
          <Text className="whitespace-pre-wrap">{appointment.notes || '-'}</Text>
        </div>

        {/* Management Block */}
        <div className="border rounded-lg p-4">
          <Heading level="h2" className="mb-3">Manage Appointment</Heading>
          <div className="space-y-4">
            <div>
              <Text className="font-medium mb-1">Status</Text>
              <Select value={status} onValueChange={setStatus}>
                <Select.Trigger>
                  <Select.Value placeholder="Select a status" />
                </Select.Trigger>
                <Select.Content>
                  {STATUS_OPTIONS.map((option) => (
                    <Select.Item key={option} value={option}>
                      {option}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            <div>
              <Text className="font-medium mb-1">Appointment Date</Text>
              <Input
                type="datetime-local"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
              />
            </div>

            <div>
              <Text className="font-medium mb-1">Admin Notes</Text>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes about this appointment"
                rows={4}
              />
            </div>

            <div>
              <Text className="font-medium mb-1">Interview Report</Text>
              <Textarea
                value={interviewReport}
                onChange={(e) => setInterviewReport(e.target.value)}
                placeholder="Report from the meeting with the customer"
                rows={6}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} isLoading={isPending}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}

export default AppointmentDetailPage
