import React, { useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getLocalToday, fromCategorySlug, toCategorySlug, isCourtVenue } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { fitzy } from "@/api/fitzyClient";
import { format, isSameDay } from "date-fns";
import { ChevronLeft, MapPin, Star, Heart, Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import CheckoutSheet from "../components/checkout/CheckoutSheet";
import { useFavoriteVenue } from "@/hooks/useFavoriteVenue";

const VenueClassCard = ({ venue, sessions, classType, categorySlug, onTimeChipSelect }) => {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavoriteVenue(venue?.id);

  const handleViewSchedule = (e) => {
    e.stopPropagation();
    navigate(`/explore/classes/${categorySlug}/schedule`);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    const handled = toggleFavorite();
    if (!handled) {
      alert("Log in to save venues to your favorites.");
    }
  };

  return (
    <motion.div
      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            {venue.logo_url ? (
              <img src={venue.logo_url} alt={venue.name} className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-lg text-gray-900">{venue.name}</h3>
              <p className="text-sm text-gray-600">{venue.neighborhood}</p>
              {venue.rating && (
                <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold">{venue.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
          <button onClick={handleFavoriteClick} className="p-2">
            <Heart className={`w-6 h-6 transition-all ${isFavorite ? "text-red-500 fill-red-500" : "text-gray-300"}`} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4">
        {sessions.length > 0 ? (
          <>
            <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onTimeChipSelect(session, venue)}
                  className="flex-shrink-0 px-4 py-2 bg-brand-100 text-brand-700 font-semibold rounded-lg hover:bg-brand-200 transition-colors"
                >
                  {format(new Date(session.start_datetime), "h:mm a")}
                </button>
              ))}
            </div>
            <button
              onClick={handleViewSchedule}
              className="mt-3 flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-800 transition-colors"
            >
              View schedule <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <p className="text-sm text-gray-500 text-center py-2">No {classType?.name} classes today</p>
        )}
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </motion.div>
  );
};

export default function CategoryResultsPage() {
  const navigate = useNavigate();
  const { categorySlug = "" } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const legacyCategory = params.get("category");
  const effectiveSlug = categorySlug || (legacyCategory ? toCategorySlug(legacyCategory) : "");
  const categoryName = legacyCategory || fromCategorySlug(effectiveSlug) || "Classes";

  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState(null);

  const { data: classTypes = [] } = useQuery({
    queryKey: ["classTypes"],
    queryFn: () => fitzy.entities.ClassType.list(),
  });
  const { data: venues = [] } = useQuery({
    queryKey: ["venues"],
    queryFn: () => fitzy.entities.Venue.list(),
  });
  const { data: allSessions = [] } = useQuery({
    queryKey: ["allSessions"],
    queryFn: () => fitzy.entities.Session.list(),
  });

  const classType = useMemo(
    () => classTypes.find((c) => toCategorySlug(c.name) === effectiveSlug.toLowerCase()),
    [classTypes, effectiveSlug]
  );

  const matchingVenueIds = useMemo(() => {
    return new Set(
      venues
        .filter(
          (venue) =>
            Array.isArray(venue.categories) &&
            venue.categories.some((category) => toCategorySlug(category) === effectiveSlug.toLowerCase())
        )
        .map((venue) => String(venue.id))
    );
  }, [venues, effectiveSlug]);
  const today = useMemo(() => getLocalToday(), []);

  const venuesWithTodayClasses = useMemo(() => {
    if (venues.length === 0 || allSessions.length === 0) return [];

    const todaySessions = allSessions.filter((s) => {
      const isToday = isSameDay(new Date(s.start_datetime), today);
      if (!isToday) return false;

      if (classType) {
        return s.class_type_id === classType.id;
      }
      return matchingVenueIds.has(String(s.venue_id));
    });

    const sessionsByVenue = todaySessions.reduce((acc, session) => {
      if (!acc[session.venue_id]) {
        acc[session.venue_id] = [];
      }
      acc[session.venue_id].push(session);
      return acc;
    }, {});

    let grouped = Object.keys(sessionsByVenue)
      .map((venueId) => {
        const venue = venues.find((v) => String(v.id) === String(venueId));
        if (!venue || isCourtVenue(venue)) return null;
        const venueMatchesCategory =
          classType || matchingVenueIds.size === 0 ? true : matchingVenueIds.has(String(venue.id));
        if (!venueMatchesCategory && !classType) return null;

        return {
          venue,
          sessions: sessionsByVenue[venueId].sort(
            (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
          ),
        };
      })
      .filter(Boolean);

    if (!classType && grouped.length === 0 && matchingVenueIds.size > 0) {
      grouped = venues
        .filter((venue) => matchingVenueIds.has(String(venue.id)) && !isCourtVenue(venue))
        .map((venue) => ({ venue, sessions: [] }));
    }

    return grouped;
  }, [classType, venues, allSessions, today, matchingVenueIds]);

  const handleTimeChipSelect = (session, venue) => {
    setSelectedSession(session);
    setSelectedVenue(venue);
    setShowCheckout(true);
  };

  const selectedSessionClassType = selectedSession
    ? classTypes.find((c) => c.id === selectedSession.class_type_id)
    : null;

  if (!classType && matchingVenueIds.size === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <p className="text-2xl font-semibold text-gray-900">Category not found</p>
          <p className="text-gray-500">Try selecting another class category from Explore.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 bg-gray-50">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{categoryName}</h1>
      </div>

      <div className="space-y-4">
        {venuesWithTodayClasses.map(({ venue, sessions }) => (
          <VenueClassCard
            key={venue.id}
            venue={venue}
            sessions={sessions}
            classType={classType}
            categorySlug={effectiveSlug}
            onTimeChipSelect={handleTimeChipSelect}
          />
        ))}
        {venuesWithTodayClasses.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <h2 className="text-xl font-semibold mb-2">No {categoryName} classes scheduled for today.</h2>
            <p>Check the full schedule for other days.</p>
          </div>
        )}
      </div>

      {showCheckout && selectedSession && selectedVenue && (
        <CheckoutSheet
          session={selectedSession}
          venue={selectedVenue}
          classType={selectedSessionClassType}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}
