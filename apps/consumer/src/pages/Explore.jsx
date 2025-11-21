
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fitzy } from "@/api/fitzyClient";
import { createPageUrl, isCourtVenue, toCategorySlug } from "@/utils";
import { Search, ChevronRight, Sunrise, Accessibility, Target, Bike, Move, Zap, Award, Trophy, Medal, Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CategoryTile = ({ category, onSelect }) => (
  <motion.button
    onClick={() => onSelect(category)}
    className="w-full bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg border border-gray-100 hover:border-transparent transition-all flex items-center justify-between text-left"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="flex items-center gap-5">
      <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center">
        <category.icon className="w-7 h-7 text-brand-600" />
      </div>
      <span className="font-bold text-lg text-gray-900">{category.name}</span>
    </div>
    <ChevronRight className="w-6 h-6 text-gray-400" />
  </motion.button>
);

export default function ExplorePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCourtsRoute = location.pathname.startsWith('/explore/courts');
  const activeTab = isCourtsRoute ? 'courts' : 'classes';
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (location.pathname === '/explore') {
      const params = new URLSearchParams(location.search);
      const tabParam = params.get('tab');
      const nextTab = tabParam === 'courts' ? 'courts' : 'classes';
      navigate(`/explore/${nextTab}`, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  const { data: venues = [], isLoading: loadingVenues } = useQuery({
    queryKey: ['explore-venues'],
    queryFn: () => fitzy.entities.Venue.list(),
  });

  const matchingVenues = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const normalized = searchQuery.trim().toLowerCase();
    const poolVenues = venues.filter((venue) =>
      activeTab === 'courts' ? isCourtVenue(venue) : !isCourtVenue(venue)
    );
    return poolVenues.filter((venue) => {
      const pool = [
        venue.name,
        venue.neighborhood,
        venue.city,
      ]
        .filter(Boolean)
        .map((value) => value.toLowerCase());
      return pool.some((value) => value.includes(normalized));
    });
  }, [venues, searchQuery, activeTab]);

const COURT_SPORTS = ["Tennis", "Padel", "Pickleball"];
const courtIconMap = {
  tennis: Trophy,
  padel: Award,
  pickleball: Medal,
};

  const classCategories = useMemo(() => {
    const set = new Set(
      venues.flatMap((venue) => venue.categories ?? [])
    );
    if (set.size === 0) {
      ["Yoga", "Pilates", "HIIT", "Cycling"].forEach((fallback) => set.add(fallback));
    }
    return Array.from(set)
      .sort()
      .map((name) => {
        const key = toCategorySlug(name);
        const iconMap = {
          yoga: Sunrise,
          pilates: Accessibility,
          boxing: Target,
          cycling: Bike,
          barre: Move,
          hiit: Zap,
        };
        const Icon = iconMap[key] || Dumbbell;
        return { name, icon: Icon };
      });
  }, [venues]);

  const courtCategories = COURT_SPORTS.map((sport) => {
    const Icon = courtIconMap[toCategorySlug(sport)] || Dumbbell;
    return { name: sport, icon: Icon };
  });

  const tabs = [
    { id: 'classes', label: 'Classes' },
    { id: 'courts', label: 'Courts' },
  ];

  const handleCategorySelect = (category) => {
    const slug = toCategorySlug(category.name);
    if (activeTab === 'courts') {
      navigate(`${createPageUrl("ExploreCourts")}/${slug}`);
    } else {
      navigate(`${createPageUrl("ExploreClasses")}/${slug}`);
    }
  };

  const handleVenueSelect = (venueId) => {
    const venue = venues.find((v) => String(v.id) === String(venueId));
    const destination =
      activeTab === 'courts' || (venue && isCourtVenue(venue))
        ? `/complexes/${venueId}`
        : `/venues/${venueId}`;
    navigate(destination);
  };

  const handleTabClick = (tabId) => {
    if (tabId === 'courts') {
      navigate(createPageUrl("ExploreCourts"));
    } else {
      navigate(createPageUrl("ExploreClasses"));
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      {/* Header */}
      <div className="px-4 mb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Explore</h1>
        
        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search venue or neighborhood..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-5 py-4 bg-white rounded-2xl border-2 border-gray-200/80 focus:border-brand-500 focus:outline-none transition-colors text-base"
            />
          </div>
          {searchQuery.trim().length > 0 && (
            <div className="mt-3 rounded-2xl border border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm max-h-72 overflow-y-auto divide-y divide-gray-100">
              {loadingVenues ? (
                <div className="p-4 text-sm text-gray-500">Searching venues...</div>
              ) : matchingVenues.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">No venues found</div>
              ) : (
                matchingVenues.map((venue) => (
                  <button
                    key={venue.id}
                    type="button"
                    onClick={() => handleVenueSelect(venue.id)}
                    className="w-full flex flex-col gap-1 px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <span className="font-semibold text-gray-900 text-base leading-tight">
                      {venue.name}
                    </span>
                    <span className="text-sm text-gray-500 leading-tight">
                      {[venue.neighborhood, venue.city].filter(Boolean).join(', ')}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Underlined Tabs */}
      <div className="flex border-b border-gray-200 px-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`relative py-3.5 px-4 text-base font-semibold transition-colors ${
              activeTab === tab.id ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-brand-600 rounded-full"
                layoutId="exploreUnderline"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {(activeTab === 'classes' ? classCategories : courtCategories).map(category => (
              <CategoryTile key={category.name} category={category} onSelect={handleCategorySelect} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
