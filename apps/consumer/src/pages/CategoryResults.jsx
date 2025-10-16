
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { fitzy } from "@/api/fitzyClient";
import { format, isSameDay } from "date-fns";
import { ChevronLeft, MapPin, Star, Heart, Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import CheckoutSheet from "../components/checkout/CheckoutSheet";

const DEMO_TODAY = new Date('2024-08-01T12:00:00Z');

const VenueClassCard = ({ venue, sessions, classType, onTimeChipSelect, onFavoriteToggle, isFavorite }) => {
  const navigate = useNavigate();

  const handleViewSchedule = (e) => {
    e.stopPropagation();
    navigate(createPageUrl("CategorySchedule") + `?category=${encodeURIComponent(classType.name)}`);
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
          <button onClick={(e) => { e.stopPropagation(); onFavoriteToggle(); }} className="p-2">
            <Heart className={`w-6 h-6 transition-all ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-300'}`} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4">
        {sessions.length > 0 ? (
          <>
            <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
              {sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => onTimeChipSelect(session, venue)}
                  className="flex-shrink-0 px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-colors"
                >
                  {format(new Date(session.start_datetime), "h:mm a")}
                </button>
              ))}
            </div>
            <button 
              onClick={handleViewSchedule} 
              className="mt-3 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
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
  const urlParams = new URLSearchParams(window.location.search);
  const categoryName = urlParams.get('category');

  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState(null);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => fitzy.auth.me() });
  const { data: favorites = [] } = useQuery({ 
      queryKey: ['favorites', user?.id], 
      queryFn: () => fitzy.entities.Favorite.filter({ user_id: user.id }),
      enabled: !!user 
  });
  const { data: classTypes = [] } = useQuery({ queryKey: ['classTypes'], queryFn: () => fitzy.entities.ClassType.list() });
  const { data: venues = [] } = useQuery({ queryKey: ['venues'], queryFn: () => fitzy.entities.Venue.list() });
  const { data: allSessions = [] } = useQuery({ queryKey: ['allSessions'], queryFn: () => fitzy.entities.Session.list() });
  
  const classType = useMemo(() => classTypes.find(c => c.name === categoryName), [classTypes, categoryName]);

  const venuesWithTodayClasses = useMemo(() => {
    if (!classType || venues.length === 0 || allSessions.length === 0) return [];
    
    const todaySessions = allSessions.filter(s => s.class_type_id === classType.id && isSameDay(new Date(s.start_datetime), DEMO_TODAY));
    
    const sessionsByVenue = todaySessions.reduce((acc, session) => {
      if (!acc[session.venue_id]) {
        acc[session.venue_id] = [];
      }
      acc[session.venue_id].push(session);
      return acc;
    }, {});

    return Object.keys(sessionsByVenue).map(venueId => {
      const venue = venues.find(v => v.id === venueId);
      if (!venue) return null;
      return {
        venue,
        sessions: sessionsByVenue[venueId].sort((a,b) => new Date(a.start_datetime) - new Date(b.start_datetime))
      };
    }).filter(Boolean);
  }, [classType, venues, allSessions]);

  const handleTimeChipSelect = (session, venue) => {
    setSelectedSession(session);
    setSelectedVenue(venue);
    setShowCheckout(true);
  };

  const handleFavoriteToggle = (venueId) => {
    // Mock favorite toggle logic
    console.log("Toggling favorite for venue:", venueId);
  };
  
  const selectedSessionClassType = selectedSession
    ? classTypes.find(c => c.id === selectedSession.class_type_id)
    : null;

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
            onTimeChipSelect={handleTimeChipSelect}
            onFavoriteToggle={() => handleFavoriteToggle(venue.id)}
            isFavorite={favorites.some(f => f.venue_id === venue.id)}
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
