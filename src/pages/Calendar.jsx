
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, User as UserIcon, Calendar as CalendarIcon, ListChecks } from "lucide-react";
import { format, isAfter, isSameDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import DateStrip from "../components/shared/DateStrip";

const DEMO_TODAY = new Date('2024-08-01T12:00:00Z');

export default function CalendarPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("reservations");
  const [selectedDate, setSelectedDate] = useState(DEMO_TODAY);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: () => base44.entities.Booking.filter({ user_id: user.id }, "-created_date"),
    enabled: !!user,
    initialData: [],
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list("start_datetime", 500),
    initialData: [],
  });

  const { data: venues, isLoading: venuesLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list(),
    initialData: [],
  });

  const { data: classTypes, isLoading: classTypesLoading } = useQuery({
    queryKey: ['classTypes'],
    queryFn: () => base44.entities.ClassType.list(),
    initialData: [],
  });

  const { data: waitlistEntries, isLoading: waitlistLoading } = useQuery({
    queryKey: ['waitlist', user?.id],
    queryFn: () => base44.entities.WaitlistEntry.filter({ user_id: user.id, status: "active" }),
    enabled: !!user,
    initialData: [],
  });

  const isLoading = bookingsLoading || sessionsLoading || venuesLoading || classTypesLoading || waitlistLoading;

  const dateFilteredBookings = bookings.filter(b => {
    const session = sessions.find(s => s.id === b.session_id);
    return session && isSameDay(new Date(session.start_datetime), selectedDate);
  });

  const now = DEMO_TODAY;
  const upcomingBookings = dateFilteredBookings.filter(b => {
    const session = sessions.find(s => s.id === b.session_id);
    return session && isAfter(new Date(session.start_datetime), now) && b.status === "confirmed";
  });

  const pastBookings = dateFilteredBookings.filter(b => {
    const session = sessions.find(s => s.id === b.session_id);
    return (session && !isAfter(new Date(session.start_datetime), now)) || b.status !== "confirmed";
  });

  const dateFilteredWaitlist = waitlistEntries.filter(entry => {
    const session = sessions.find(s => s.id === entry.session_id);
    return session && isSameDay(new Date(session.start_datetime), selectedDate);
  });

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const BookingCard = ({ booking }) => {
    const session = sessions.find(s => s.id === booking.session_id);
    const venue = session ? venues.find(v => v.id === session.venue_id) : null;
    const classType = session ? classTypes.find(c => c.id === session.class_type_id) : null;

    if (!session || !venue) return null;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        onClick={() => navigate(createPageUrl("ReservationDetails") + `?bookingId=${booking.id}`)}
        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{classType?.name || "Class"}</h3>
            <div className="flex items-center gap-2.5 text-sm text-gray-600 mt-1.5">
              <MapPin className="w-4 h-4" />
              <span>{venue.name}</span>
            </div>
          </div>
          {getStatusBadge(booking.status)}
        </div>

        <div className="space-y-2.5 text-sm text-gray-700">
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="w-4 h-4 text-gray-500" />
            <span>{format(new Date(session.start_datetime), "EEEE, MMM d")}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-gray-500" />
            <span>
              {format(new Date(session.start_datetime), "h:mm a")} - {format(new Date(session.end_datetime), "h:mm a")}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <UserIcon className="w-4 h-4 text-gray-500" />
            <span>Coach: {session.coach_name}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  const tabs = [
    { id: 'reservations', label: 'Reservations' },
    { id: 'waitlist', label: waitlistEntries.length > 0 ? `Waitlist (${waitlistEntries.length})` : 'Waitlist' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">My Calendar</h1>

        {/* Underlined Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative py-3.5 px-4 text-base font-semibold transition-colors ${
                activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full"
                  layoutId="underline"
                />
              )}
            </button>
          ))}
        </div>
      </div>
      
      <div className="py-5">
        <DateStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      </div>

      <div className="px-4">
        <AnimatePresence mode="wait">
          {activeTab === "reservations" ? (
            <motion.div key="reservations" className="space-y-8">
              {dateFilteredBookings.length > 0 ? (
                <>
                  {upcomingBookings.length > 0 && (
                    <div>
                      <h2 className="font-bold text-lg text-gray-900 mb-4">Upcoming</h2>
                      <div className="space-y-4">
                        <AnimatePresence>
                          {upcomingBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                  {pastBookings.length > 0 && (
                    <div>
                      <h2 className="font-bold text-lg text-gray-900 mb-4">Past</h2>
                      <div className="space-y-4">
                         <AnimatePresence>
                          {pastBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center pt-16 pb-8 text-gray-500">
                  <CalendarIcon className="w-16 h-16 mx-auto mb-5 text-gray-300" />
                  <p className="font-semibold text-lg">No reservations for this day</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="waitlist" className="space-y-4">
              {dateFilteredWaitlist.length > 0 ? (
                <AnimatePresence>
                  {dateFilteredWaitlist.map((entry) => {
                    const session = sessions.find(s => s.id === entry.session_id);
                    const venue = session ? venues.find(v => v.id === session.venue_id) : null;
                    if (!session || !venue) return null;

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        key={entry.id}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{venue.name}</h3>
                            <p className="text-sm text-gray-600 mt-1.5">
                              {format(new Date(session.start_datetime), "EEEE, MMM d 'at' h:mm a")}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                            Position {entry.position}
                          </span>
                        </div>
                        <button className="w-full text-center mt-2 py-2 text-red-600 font-semibold hover:text-red-700 transition-colors">
                          Leave waitlist
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <div className="text-center pt-16 pb-8 text-gray-500">
                  <ListChecks className="w-16 h-16 mx-auto mb-5 text-gray-300" />
                  <p className="font-semibold text-lg">No waitlist items for this day</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
