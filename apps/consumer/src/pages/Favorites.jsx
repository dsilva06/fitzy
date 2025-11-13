
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fitzy } from "@/api/fitzyClient";
import { useQuery } from "@tanstack/react-query";
import { Heart, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VenueCard from "../components/shared/VenueCard";
import CheckoutSheet from "../components/checkout/CheckoutSheet";
import { getLocalToday } from "@/utils";

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("classes");
  const [selectedDate] = useState(() => getLocalToday());
  const [selectedSession, setSelectedSession] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => fitzy.auth.me(),
  });

  const { data: favorites, isLoading: favoritesLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => fitzy.entities.Favorite.filter({ user_id: user.id }),
    enabled: !!user,
    initialData: [],
  });

  const { data: venues, isLoading: venuesLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: () => fitzy.entities.Venue.list(),
    initialData: [],
  });

  const { data: classTypes } = useQuery({
    queryKey: ['classTypes'],
    queryFn: () => fitzy.entities.ClassType.list(),
    initialData: [],
  });

  const favoriteVenues = venues.filter(v => favorites.some(f => f.venue_id === v.id));

  const displayedVenues = favoriteVenues.filter(venue => {
    if (activeTab === 'classes') {
      return venue.venue_type === 'class_studio' || venue.venue_type === 'gym';
    }
    if (activeTab === 'courts') {
      return venue.venue_type === 'court_facility' || venue.venue_type === 'gym';
    }
    return false;
  });

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    setShowCheckout(true);
  };

  const handleWaitlistClick = (session) => {
    alert("Waitlist functionality coming soon!");
  };

  const selectedSessionVenue = selectedSession 
    ? venues.find(v => v.id === selectedSession.venue_id)
    : null;

  const selectedSessionClassType = selectedSession
    ? classTypes.find(c => c.id === selectedSession.class_type_id)
    : null;
    
  const isLoading = favoritesLoading || venuesLoading;

  const tabs = [
    { id: 'classes', label: 'Classes' },
    { id: 'courts', label: 'Courts' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-gray-50">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Favorites</h1>
      </div>
      <p className="text-gray-600 px-1 mb-8">Your preferred venues for quick booking.</p>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative py-3 px-4 text-base font-semibold transition-colors ${
              activeTab === tab.id ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-brand-600 rounded-full"
                layoutId="favoritesUnderline"
              />
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
         <div className="text-center py-24 text-gray-500">Loading favorites...</div>
      ) : displayedVenues.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence>
            {displayedVenues.map((venue) => (
              <motion.div
                key={venue.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <VenueCard
                  venue={venue}
                  selectedDate={selectedDate}
                  onSessionSelect={handleSessionSelect}
                  onWaitlistClick={handleWaitlistClick}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-24">
            <div className="inline-block bg-white p-6 rounded-full mb-6 shadow-sm border">
                <Heart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              No Favorite {activeTab === 'classes' ? 'Classes' : 'Courts'} Added
            </h2>
            <p className="text-gray-500 mt-2">
                Tap the heart on any venue to add it to this list.
            </p>
        </div>
      )}

      {/* Checkout Sheet */}
      {showCheckout && selectedSession && selectedSessionVenue && (
        <CheckoutSheet
          session={selectedSession}
          venue={selectedSessionVenue}
          classType={selectedSessionClassType}
          onClose={() => {
            setShowCheckout(false);
            setSelectedSession(null);
          }}
          onSuccess={() => {
            setShowCheckout(false);
            setSelectedSession(null);
          }}
        />
      )}
    </div>
  );
}
