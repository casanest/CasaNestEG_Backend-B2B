import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type AppointmentDateField = "created_at" | "appointment_date";
export type AppointmentStatus = "pending" | "contacted" | "scheduled" | "completed" | "cancelled";
export type AppointmentSortBy = "customer_name" | "created_at" | "status";
export type AppointmentSortOrder = "asc" | "desc";

export type AppointmentsQuery = {
  limit?: number;
  offset?: number;
  status?: AppointmentStatus;
  from?: string;
  to?: string;
  date_field?: AppointmentDateField;
  sort_by?: AppointmentSortBy;
  sort_order?: AppointmentSortOrder;
};

export const useAppointments = (query: AppointmentsQuery = {}) => {
  const queryParams = new URLSearchParams();
  if (query.limit) queryParams.append("limit", query.limit.toString());
  if (query.offset) queryParams.append("offset", query.offset.toString());
  if (query.status) queryParams.append("status", query.status);
  if (query.from) queryParams.append("from", query.from);
  if (query.to) queryParams.append("to", query.to);
  if (query.date_field) queryParams.append("date_field", query.date_field);
  if (query.sort_by) queryParams.append("sort_by", query.sort_by);
  if (query.sort_order) queryParams.append("sort_order", query.sort_order);
  // The From/To pickers produce date-only values in the admin's local timezone,
  // so the server needs the offset to resolve them to the right UTC instants.
  if (query.from || query.to) {
    queryParams.append("tz_offset", new Date().getTimezoneOffset().toString());
  }

  return useQuery({
    queryKey: ["appointments", query],
    queryFn: async () => {
      const response = await fetch(
        `/admin/appointments?${queryParams.toString()}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }
      return response.json();
    },
  });
};

export const useAppointment = (id: string) => {
  return useQuery({
    queryKey: ["appointment", id],
    queryFn: async () => {
      const response = await fetch(`/admin/appointments/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch appointment");
      }
      return response.json();
    },
  });
};

export const useAppointmentAttachments = (id: string) => {
  return useQuery({
    queryKey: ["appointment_attachments", id],
    queryFn: async () => {
      const response = await fetch(`/admin/appointments/${id}/attachments`);
      if (!response.ok) {
        throw new Error("Failed to fetch appointment attachments");
      }
      return response.json();
    },
  });
};

export type UpdateAppointmentPayload = {
  status?: string;
  admin_notes?: string | null;
  interview_report?: string | null;
  appointment_date?: string | null;
};

export const useUpdateAppointment = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateAppointmentPayload) => {
      const response = await fetch(`/admin/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Failed to update appointment");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};
