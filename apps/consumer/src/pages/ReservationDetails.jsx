import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { fitzy } from "@/api/fitzyClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, MapPin, Clock, User as UserIcon, Calendar as CalendarIcon, CreditCard } from "lucide-react";
import { format, isBefore } from "date-fns";

export default function ReservationDetailsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { bookingId: routeBookingId } = useParams();
  const [searchParams] = useSearchParams();
  const bookingId = routeBookingId ?? searchParams.get('bookingId');

  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const bookings = await fitzy.entities.Booking.list();
      return bookings.find(b => String(b.id) === String(bookingId));
    },
    enabled: !!bookingId,
  });

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session', booking?.session_id],
    queryFn: async () => {
      const sessions = await fitzy.entities.Session.list();
      return sessions.find(s => String(s.id) === String(booking.session_id));
    },
    enabled: !!booking,
  });

  const { data: venue, isLoading: venueLoading } = useQuery({
    queryKey: ['venue', session?.venue_id],
    queryFn: async () => {
      const venues = await fitzy.entities.Venue.list();
      return venues.find(v => String(v.id) === String(session.venue_id));
    },
    enabled: !!session,
  });

  const { data: classType } = useQuery({
    queryKey: ['classType', session?.class_type_id],
    queryFn: async () => {
      const classTypes = await fitzy.entities.ClassType.list();
      return classTypes.find(c => String(c.id) === String(session.class_type_id));
    },
    enabled: !!session,
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async () => {
      await fitzy.entities.Booking.update(bookingId, { status: "cancelled" });
      await fitzy.entities.Session.update(session.id, {
        capacity_taken: session.capacity_taken - 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      navigate(-1);
    },
  });

  if (!bookingId) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 p-2 hover:bg-gray-100 rounded-lg transition-colors inline-flex"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Missing reservation</h1>
          <p className="text-gray-600">We could not open this reservation because no booking ID was provided.</p>
        </div>
      </div>
    );
  }

  if (bookingLoading || sessionLoading || venueLoading) {
    return <div className="min-h-screen pt-20 px-4">Loading...</div>;
  }

  if (!booking || !session || !venue) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 p-2 hover:bg-gray-100 rounded-lg transition-colors inline-flex"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reservation not found</h1>
          <p className="text-gray-600">It looks like this booking no longer exists. Please try again from your calendar.</p>
        </div>
      </div>
    );
  }

  const canCancel = booking.status === "confirmed" && 
    isBefore(new Date(), new Date(booking.cancellation_deadline));

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 p-2 hover:bg-gray-100 rounded-lg transition-colors inline-flex"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Reservation Details</h1>

      {/* Main Card */}
      <div className="bg-gradient-to-br from-brand-50 to-brand-100 rounded-3xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {classType?.name || "Class"}
        </h2>

        <div className="space-y-3 text-gray-700">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-brand-600 mt-0.5" />
            <div>
              <p className="font-semibold">{venue.name}</p>
              <p className="text-sm text-gray-600">{venue.neighborhood}, {venue.city}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-brand-600" />
            <span>{format(new Date(session.start_datetime), "EEEE, MMMM d, yyyy")}</span>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-brand-600" />
            <span>
              {format(new Date(session.start_datetime), "h:mm a")} - {format(new Date(session.end_datetime), "h:mm a")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <UserIcon className="w-5 h-5 text-brand-600" />
            <span>Coach: {session.coach_name}</span>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="space-y-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Payment</h3>
          </div>
          <p className="text-gray-600">Amount: ${session.price}</p>
          <p className="text-sm text-gray-500 mt-1">Booking ID: {booking.id}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-md">
          <h3 className="font-semibold text-gray-900 mb-2">Cancellation Policy</h3>
          <p className="text-gray-600 text-sm">
            {canCancel 
              ? `You can cancel this reservation until ${format(new Date(booking.cancellation_deadline), "MMM d 'at' h:mm a")}`
              : "Cancellation window has closed"}
          </p>
        </div>
      </div>

      {/* Actions */}
      {canCancel && (
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to cancel this reservation?")) {
              cancelBookingMutation.mutate();
            }
          }}
          className="w-full py-4 bg-red-600 text-white font-bold text-lg rounded-2xl hover:bg-red-700 transition-colors"
        >
          Cancel Reservation
        </button>
      )}
    </div>
  );
}
