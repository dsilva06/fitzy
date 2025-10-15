
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, ChevronRight, Sunrise, Accessibility, Target, Bike, Move, Zap, Award, Trophy, Medal } from "lucide-react";
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
      <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
        <category.icon className="w-7 h-7 text-blue-600" />
      </div>
      <span className="font-bold text-lg text-gray-900">{category.name}</span>
    </div>
    <ChevronRight className="w-6 h-6 text-gray-400" />
  </motion.button>
);

export default function ExplorePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const initialTab = urlParams.get('tab') || 'classes';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  const classCategories = [
    { name: 'Yoga', icon: Sunrise },
    { name: 'Pilates', icon: Accessibility },
    { name: 'Boxing', icon: Target },
    { name: 'Cycling', icon: Bike },
    { name: 'Barre', icon: Move },
    { name: 'HIIT', icon: Zap },
  ];

  const courtCategories = [
    { name: 'Tennis', icon: Trophy },
    { name: 'Padel', icon: Award },
    { name: 'Pickleball', icon: Medal },
  ];

  const tabs = [
    { id: 'classes', label: 'Classes' },
    { id: 'courts', label: 'Courts' },
  ];

  const handleCategorySelect = (category) => {
    const isCourtCategory = courtCategories.some(c => c.name === category.name);
    const fromTab = isCourtCategory ? 'courts' : 'classes';
    navigate(createPageUrl("CategoryResults") + `?category=${encodeURIComponent(category.name)}&fromTab=${fromTab}`);
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    navigate(createPageUrl("Explore") + `?tab=${tabId}`, { replace: true });
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      {/* Header */}
      <div className="px-4 mb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Explore</h1>
        
        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search venue or neighborhood..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-5 py-4 bg-white rounded-2xl border-2 border-gray-200/80 focus:border-blue-500 focus:outline-none transition-colors text-base"
          />
        </div>
      </div>

      {/* Underlined Tabs */}
      <div className="flex border-b border-gray-200 px-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`relative py-3.5 px-4 text-base font-semibold transition-colors ${
              activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full"
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
