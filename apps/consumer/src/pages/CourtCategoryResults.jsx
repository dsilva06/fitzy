import React, { useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fitzy } from "@/api/fitzyClient";
import { format, isSameDay } from "date-fns";
import { ChevronLeft, MapPin, Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { fromCategorySlug, toCategorySlug, getLocalToday, isCourtVenue } from "@/utils";

export default function CourtCategoryResultsPage() {
  const navigate = useNavigate();
  const { sportSlug = "" } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const legacyCategory = params.get("category");
  const effectiveSlug = sportSlug || (legacyCategory ? toCategorySlug(legacyCategory) : "");
  const sportName = legacyCategory || fromCategorySlug(effectiveSlug) || "Courts";

  const { data: classTypes = [] } = useQuery({
    queryKey: ["classTypes"],
    queryFn: () => fitzy.entities.ClassType.list(),
  });
  const { data: venues = [] } = useQuery({
    queryKey: ["venues"],
    queryFn: () => fitzy.entities.Venue.list(),
  });
  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => fitzy.entities.Session.list(),
  });

  const courtType = useMemo(
    () => classTypes.find((type) => toCategorySlug(type.name) === effectiveSlug.toLowerCase()),
    [classTypes, effectiveSlug]
  );

  const matchingComplexIds = useMemo(() => {
    return new Set(
      venues
        .filter((venue) => {
          if (!Array.isArray(venue.categories)) return false;
          return venue.categories.some(
            (tag) => toCategorySlug(tag) === effectiveSlug.toLowerCase()
          );
        })
        .map((venue) => String(venue.id))
    );
  }, [venues, effectiveSlug]);
  const today = useMemo(() => getLocalToday(), []);

  const complexes = useMemo(() => {
    const courtSessions = sessions.filter((session) => {
      if (!isSameDay(new Date(session.start_datetime), today)) return false;
      if (courtType) {
        return session.class_type_id === courtType.id;
      }
      return matchingComplexIds.has(String(session.venue_id));
    });

    const grouped = courtSessions.reduce((acc, session) => {
      if (!acc[session.venue_id]) {
        acc[session.venue_id] = [];
      }
      acc[session.venue_id].push(session);
      return acc;
    }, {});

    let results = Object.keys(grouped)
      .map((venueId) => {
        const venue = venues.find((v) => String(v.id) === String(venueId));
        if (!venue || !isCourtVenue(venue)) return null;
        const slots = grouped[venueId]
          .sort(
            (a, b) =>
              new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
          )
          .slice(0, 4);
        return { venue, slots };
      })
      .filter(Boolean);

    if (!courtType && results.length === 0) {
      results = venues
        .filter((venue) => matchingComplexIds.has(String(venue.id)) && isCourtVenue(venue))
        .map((venue) => ({ venue, slots: [] }));
    }

    return results;
  }, [courtType, sessions, venues, today, matchingComplexIds]);

  if (!courtType && matchingComplexIds.size === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <p className="text-2xl font-semibold text-gray-900">Sport not found</p>
          <p className="text-gray-500">Select another sport from Explore.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-gray-50">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{sportName}</h1>
      </div>
      <div className="space-y-4">
        {complexes.map(({ venue, slots }) => (
          <motion.div
            key={venue.id}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">{venue.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{[venue.neighborhood, venue.city].filter(Boolean).join(", ")}</span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/complexes/${venue.id}`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors"
              >
                View complex <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                Today&apos;s available slots
              </p>
              {slots.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => navigate(`/courts/${venue.id}`)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-semibold flex items-center gap-2 text-slate-900 hover:bg-slate-200 transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                      {format(new Date(slot.start_datetime), "h:mm a")}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No slots remaining today.</p>
              )}
            </div>
          </motion.div>
        ))}

        {complexes.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <h2 className="text-xl font-semibold mb-2">No complexes match this sport today.</h2>
            <p>Try another sport or view the complex list.</p>
          </div>
        )}
      </div>
    </div>
  );
}
