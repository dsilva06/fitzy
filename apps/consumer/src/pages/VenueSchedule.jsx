import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { fitzy } from "@/api/fitzyClient";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, MapPin, Clock, User as UserIcon } from "lucide-react";
import { format, isSameDay } from "date-fns";
import DateStrip from "../components/shared/DateStrip";
import CheckoutSheet from "../components/checkout/CheckoutSheet";
import { isCourtVenue } from "@/utils";
import { motion } from "framer-motion";

export default function VenueSchedulePage() {
  const navigate = useNavigate();
  const { venueId: paramVenueId } = useParams();
  const location = useLocation();
  const legacyId = new URLSearchParams(location.search).get("venueId");
  const venueId = paramVenueId ?? legacyId;

  const [activeTab, setActiveTab] = useState("classes");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [bookedSessionIds, setBookedSessionIds] = useState([]);

  const { data: venue } = useQuery({
    queryKey: ['venue', venueId],
    queryFn: async () => {
      if (!venueId) return null;
      return fitzy.entities.Venue.show(venueId);
    },
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', venueId, selectedDate],
    queryFn: async () => {
      const allSessions = await fitzy.entities.Session.filter({ venue_id: venueId }, "start_datetime");
      return allSessions.filter(s => isSameDay(new Date(s.start_datetime), selectedDate));
    },
  });

  const { data: classTypes } = useQuery({
    queryKey: ['classTypes'],
    queryFn: () => fitzy.entities.ClassType.list(),
    initialData: [],
  });

  const { data: packages } = useQuery({
    queryKey: ['packages', venueId],
    queryFn: () => fitzy.entities.Package.filter({ venue_id: venueId }),
    initialData: [],
  });

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        Loading venue...
      </div>
    );
  }

  if (isCourtVenue(venue)) {
    navigate(`/courts/${venueId}`, { replace: true });
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

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      {/* Header */}
      <div className="px-5 mb-10 space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors inline-flex"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex items-start gap-4">
          {venue.logo_url ? (
            <img 
              src={venue.logo_url} 
              alt={venue.name}
              className="w-20 h-20 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-2xl">
              {venue.name[0]}
            </div>
          )}
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-gray-900">{venue.name}</h1>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{venue.neighborhood}, {venue.city}</span>
            </div>
            <button
              onClick={() => navigate(`/venues/${venueId}`)}
              className="text-sm font-semibold text-brand-600 inline-flex items-center gap-1"
            >
              View details
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-6">
        <div className="flex border-b border-gray-200">
          {["classes", "packages"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-3 text-base font-semibold relative transition-colors ${
                activeTab === tab ? "text-brand-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "classes" ? "Classes" : "Packages"}
              {activeTab === tab && (
                <motion.span
                  layoutId="venueScheduleTabUnderline"
                  className="absolute inset-x-0 -bottom-0.5 h-1 rounded-full bg-brand-600"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "classes" ? (
        <>
          <DateStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />

          <div className="px-5 mt-6 space-y-5">
            <div className="px-1 text-sm text-gray-500">
              {format(selectedDate, "EEEE, MMM d")}
            </div>
            {sessionsForSelectedDate.map((session) => {
              const classType = classTypes.find((c) => c.id === session.class_type_id);
              const capacityLeft = session.capacity_total - session.capacity_taken;
              const isFull = capacityLeft <= 0;
              const startDate = new Date(session.start_datetime);

              return (
                <div
                  key={session.id}
                  onClick={() => navigate(`/classes/${session.id}?venueId=${venueId}`)}
                  className="bg-white rounded-3xl px-5 py-4 shadow-sm border border-white grid grid-cols-[90px_minmax(0,1fr)_auto] items-center gap-4 w-full text-left hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="text-left space-y-1">
                    <div className="text-lg font-semibold text-gray-900">
                      {format(startDate, "h:mm a")}
                    </div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">
                      {session.duration_minutes || 60} min
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-gray-500 uppercase tracking-wider">
                      {classType?.name || "Class"}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {session.name}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      <span>{session.coach_name || session.instructor?.name}</span>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="text-xl font-semibold text-gray-900">${session.price}</div>
                    <div className="text-xs text-gray-500">{session.credit_cost} credits</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isFull) {
                          setSelectedSession(session);
                          setShowCheckout(true);
                        }
                      }}
                      disabled={isFull}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                        isFull ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-brand-600 text-white hover:bg-brand-700"
                      }`}
                    >
                      Quick book
                    </button>
                    <div
                      className={`text-xs font-medium ${
                        isFull
                          ? "text-red-600"
                          : capacityLeft <= 3
                            ? "text-orange-600"
                            : "text-green-600"
                      }`}
                    >
                      {isFull ? "Class full" : `${capacityLeft} spots left`}
                    </div>
                  </div>
                </div>
              );
            })}

            {sessionsForSelectedDate.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No classes available for this date
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="px-5 space-y-4">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="font-bold text-xl text-gray-900 mb-2">{pkg.name}</h3>
              <p className="text-gray-600 mb-4">Valid for {pkg.validity_months} months</p>
              <div className="flex justify-between items-center">
                <span className="text-3xl font-bold text-gray-900">${pkg.price}</span>
                <button className="px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors">
                  Buy Package
                </button>
              </div>
            </div>
          ))}

          {packages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No packages available
            </div>
          )}
        </div>
      )}

      {showCheckout && selectedSession && venue && (
        <CheckoutSheet
          session={selectedSession}
          venue={venue}
          classType={classTypes.find((c) => c.id === selectedSession.class_type_id)}
          onClose={() => {
            setShowCheckout(false);
            setSelectedSession(null);
          }}
          onSuccess={() => {
            setBookedSessionIds((prev) =>
              prev.includes(selectedSession.id) ? prev : [...prev, selectedSession.id]
            );
            setShowCheckout(false);
            setSelectedSession(null);
          }}
        />
      )}
    </div>
  );
}
