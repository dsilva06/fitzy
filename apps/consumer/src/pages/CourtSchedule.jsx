import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fitzy } from "@/api/fitzyClient";
import { ChevronLeft, MapPin, User as UserIcon, Clock } from "lucide-react";
import { format, isSameDay } from "date-fns";
import DateStrip from "../components/shared/DateStrip";
import CheckoutSheet from "../components/checkout/CheckoutSheet";
import { getLocalToday, isCourtVenue } from "@/utils";
import { motion } from "framer-motion";

export default function CourtSchedulePage() {
  const navigate = useNavigate();
  const { courtId } = useParams();
  const location = useLocation();
  const legacyId = new URLSearchParams(location.search).get("venueId");
  const venueId = courtId ?? legacyId;

  const [selectedDate, setSelectedDate] = useState(() => getLocalToday());
  const [selectedSession, setSelectedSession] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [bookedSessionIds, setBookedSessionIds] = useState([]);

  const { data: venue, isLoading: loadingVenue, error: venueError } = useQuery({
    queryKey: ["court-venue", venueId],
    queryFn: async () => {
      if (!venueId) return null;
      return fitzy.entities.Venue.show(venueId);
    },
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["court-sessions", venueId, selectedDate],
    queryFn: async () => {
      const allSessions = await fitzy.entities.Session.filter({ venue_id: venueId }, "start_datetime");
      return allSessions.filter((session) =>
        isSameDay(new Date(session.start_datetime), selectedDate)
      );
    },
    enabled: Boolean(venueId),
  });

  const { data: classTypes = [] } = useQuery({
    queryKey: ["classTypes"],
    queryFn: () => fitzy.entities.ClassType.list(),
  });

  if (loadingVenue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        Loading court...
      </div>
    );
  }

  if (!venue || venueError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        Court not found.
      </div>
    );
  }

  if (!isCourtVenue(venue)) {
    navigate(`/venues/${venueId}/schedule`, { replace: true });
    return null;
  }

  const sessionsForSelectedDate = useMemo(() => {
    return [...sessions]
      .filter((session) =>
        isSameDay(new Date(session.start_datetime), selectedDate)
      )
      .sort(
      (a, b) =>
        new Date(a.start_datetime).getTime() -
        new Date(b.start_datetime).getTime()
    );
  }, [sessions, selectedDate]);

  useEffect(() => {
    if (!sessions.length) return;
    const hasSessionsForSelected = sessions.some((session) =>
      isSameDay(new Date(session.start_datetime), selectedDate)
    );
    if (!hasSessionsForSelected) {
      const nextSession = [...sessions].sort(
        (a, b) => new Date(a.start_datetime) - new Date(b.start_datetime)
      )[0];
      if (nextSession) {
        setSelectedDate(new Date(nextSession.start_datetime));
      }
    }
  }, [sessions, selectedDate]);

  const handleBookSession = (session) => {
    if (bookedSessionIds.includes(session.id)) return;
    setSelectedSession(session);
    setShowCheckout(true);
  };

  const selectedSessionClassType = selectedSession
    ? classTypes.find((c) => c.id === selectedSession.class_type_id)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="px-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors inline-flex"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex items-start gap-4 mt-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-700 text-white flex items-center justify-center text-2xl font-semibold">
            {venue.name[0]}
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Court schedule</p>
            <h1 className="text-3xl font-semibold text-slate-900">{venue.name}</h1>
            <div className="flex items-center gap-2 text-slate-600 mt-1">
              <MapPin className="w-4 h-4" />
              <span>
                {[venue.neighborhood, venue.city].filter(Boolean).join(", ")}
              </span>
            </div>
            <button
              onClick={() => navigate(`/complexes/${venueId}`)}
              className="mt-2 inline-flex items-center text-sm font-semibold text-slate-700 gap-1"
            >
              View court details →
            </button>
          </div>
        </div>
      </div>

      <div className="px-4">
        <DateStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />

        <div className="mt-6 space-y-4">
          <div className="px-1 text-sm text-slate-500 uppercase tracking-wide">
            {format(selectedDate, "EEEE, MMM d")}
          </div>

          {sessionsForSelectedDate.length === 0 ? (
            <div className="text-center text-slate-500 py-16">
              No slots available. Try another day.
            </div>
          ) : (
            sessionsForSelectedDate.map((session) => {
              const start = new Date(session.start_datetime);
              const capacityLeft = session.capacity_total - session.capacity_taken;
              const isFull = capacityLeft <= 0;
              const alreadyBooked = bookedSessionIds.includes(session.id);

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-5 border border-white shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {format(start, "h:mm a")}
                    </div>
                    <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4" />
                      {session.duration_minutes || 60} min slot
                    </div>
                  </div>
                  <div className="flex-1 text-left sm:text-center space-y-1">
                    <p className="text-sm uppercase tracking-wide text-slate-500">
                      Hosted by
                    </p>
                    <p className="text-base font-semibold text-slate-900 flex items-center gap-2 justify-start sm:justify-center">
                      <UserIcon className="w-4 h-4" />
                      {session.coach_name || "Court Host"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {capacityLeft > 0
                        ? `${capacityLeft} player spot${capacityLeft !== 1 ? "s" : ""} left`
                        : "Full"}
                    </p>
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="text-xl font-semibold text-slate-900">
                      ${session.price}
                    </div>
                    <button
                      onClick={() => handleBookSession(session)}
                      disabled={isFull || alreadyBooked}
                      className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                        isFull || alreadyBooked
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                    >
                      {alreadyBooked ? "Booked" : isFull ? "Waitlist" : "Reserve"}
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {showCheckout && selectedSession && (
        <CheckoutSheet
          session={selectedSession}
          venue={venue}
          classType={selectedSessionClassType}
          onClose={() => {
            setShowCheckout(false);
            setSelectedSession(null);
          }}
          onSuccess={() => {
            setBookedSessionIds((prev) => [...prev, selectedSession.id]);
            setShowCheckout(false);
            setSelectedSession(null);
          }}
        />
      )}
    </div>
  );
}
