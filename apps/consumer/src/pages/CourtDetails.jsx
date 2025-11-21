import React, { useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fitzy } from "@/api/fitzyClient";
import { MapPin, Share2, Droplet, Star, Sun, ParkingCircle, ShowerHead, Lock, Heart, Clock, Calendar as CalendarIcon } from "lucide-react";
import { addDays, format, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import DateStrip from "../components/shared/DateStrip";
import { getLocalToday, isCourtVenue } from "@/utils";
import { useFavoriteVenue } from "@/hooks/useFavoriteVenue";

const heroFallback =
  "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1600&q=60";

const defaultAmenities = ["Lights", "Locker rooms", "Showers", "Water refill", "Equipment rental", "Parking"];

function AmenityPill({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium">
      <Icon className="w-4 h-4 text-slate-500" />
      {label}
    </div>
  );
}

const amenityIcons = {
  Lights: Sun,
  "Locker rooms": Lock,
  Showers: ShowerHead,
  "Water refill": Droplet,
  "Equipment rental": Star,
  Parking: ParkingCircle,
};

export default function CourtDetailsPage() {
  const navigate = useNavigate();
  const { complexId } = useParams();
  const location = useLocation();
  const legacyId = new URLSearchParams(location.search).get("venueId");
  const venueId = complexId ?? legacyId;

  const [selectedDate, setSelectedDate] = useState(() => getLocalToday());

  const { data: venue, isLoading: loadingVenue, error: venueError } = useQuery({
    queryKey: ["court-venue", venueId],
    queryFn: async () => {
      if (!venueId) return null;
      return fitzy.entities.Venue.show(venueId);
    },
  });

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ["court-sessions", venueId],
    queryFn: async () => {
      if (!venueId) return [];
      return fitzy.entities.Session.filter({ venue_id: venueId }, "start_datetime");
    },
    enabled: Boolean(venueId),
  });

  const { isFavorite, toggleFavorite } = useFavoriteVenue(venue?.id);

  const sessionsForDay = useMemo(() => {
    return sessions
      .filter((session) => isSameDay(new Date(session.start_datetime), selectedDate))
      .sort(
        (a, b) =>
          new Date(a.start_datetime).getTime() -
          new Date(b.start_datetime).getTime()
      );
  }, [sessions, selectedDate]);

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
    navigate(`/venues/${venueId}`, { replace: true });
    return null;
  }

  const heroImage = venue.cover_image_url || heroFallback;
  const amenities = venue.amenities && venue.amenities.length > 0 ? venue.amenities : defaultAmenities;

  const dayTabs = useMemo(() => Array.from({ length: 5 }).map((_, idx) => addDays(new Date(), idx)), []);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="relative h-[340px] sm:h-[420px] mb-6">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 z-20 bg-white/90 backdrop-blur rounded-full p-2 shadow"
          >
            <span className="text-sm font-semibold">&larr;</span>
          </button>

          <button
            onClick={() => {
              const handled = toggleFavorite();
              if (!handled) alert("Log in to save courts to favorites.");
            }}
            className="absolute top-6 right-6 z-20 bg-white/90 backdrop-blur rounded-full p-2 shadow text-brand-600"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
          </button>

          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
            <p className="uppercase tracking-[0.3em] text-white/70 text-xs">
              Premium courts
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold mt-2">{venue.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm mt-4">
              <span className="inline-flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {[venue.neighborhood, venue.city].filter(Boolean).join(" · ")}
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {venue.rating ?? "4.8"}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 space-y-10">
          <section className="bg-white rounded-3xl shadow-lg p-6 sm:p-8 border border-white">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Court overview</h2>
                <p className="text-slate-600 mt-1">
                  Reserve premium courts with professional lighting, hosts and full amenities.
                </p>
              </div>
              <button
                onClick={() => navigate(`/courts/${venueId}`)}
                className="px-5 py-3 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
              >
                View schedule
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Surface</p>
                <p className="font-semibold text-lg text-slate-900">High-performance</p>
                <p className="text-sm text-slate-500">Ideal for padel & tennis</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Rate</p>
                <p className="font-semibold text-lg text-slate-900">$30-$45 / hour</p>
                <p className="text-sm text-slate-500">Prices vary by slot</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Players</p>
                <p className="font-semibold text-lg text-slate-900">Up to 4</p>
                <p className="text-sm text-slate-500">Split payment available</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 border border-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900">Amenities</h3>
              <Share2 className="w-5 h-5 text-slate-400" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {amenities.map((amenity) => {
                const Icon = amenityIcons[amenity] || Sun;
                return <AmenityPill key={amenity} icon={Icon} label={amenity} />;
              })}
            </div>
          </section>

          <section className="bg-white rounded-3xl shadow-sm border border-white p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" /> Upcoming availability
                </h3>
                <p className="text-slate-600 text-sm mt-1">
                  Pick a day to preview available slots.
                </p>
              </div>
            </div>

            <DateStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />

            {loadingSessions ? (
              <div className="py-10 text-center text-slate-500">Loading slots...</div>
            ) : sessionsForDay.length === 0 ? (
              <div className="py-10 text-center text-slate-500">
                No slots on {format(selectedDate, "EEE, MMM d")}. View full schedule for more options.
              </div>
            ) : (
              <div className="space-y-4">
                {sessionsForDay.map((session) => {
                  const start = new Date(session.start_datetime);
                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-100 p-4"
                    >
                      <div className="space-y-1">
                        <div className="text-lg font-semibold text-slate-900">
                          {format(start, "h:mm a")}
                        </div>
                        <div className="text-sm text-slate-500">
                          {session.duration_minutes || 60} minutes · ${session.price}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/courts/${venueId}`)}
                        className="px-5 py-2 rounded-full bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors"
                      >
                        Reserve slot
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
