

import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Compass, Calendar, Package, Wallet, CreditCard, Heart, Settings, HelpCircle, LogOut, X, User as UserIcon } from "lucide-react";
import { fitzy } from "@/api/fitzyClient";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => fitzy.auth.me(),
    initialData: null,
  });

  const navItems = [
    { name: "Home", path: createPageUrl("Home"), icon: Home },
    { name: "Explore", path: createPageUrl("Explore"), icon: Compass },
    { name: "Calendar", path: createPageUrl("Calendar"), icon: Calendar },
    { name: "Packages", path: createPageUrl("Packages"), icon: Package },
  ];

  const drawerItems = [
    { name: "Personal Info", path: createPageUrl("PersonalInfo"), icon: UserIcon },
    { name: "Wallet", path: createPageUrl("Wallet"), icon: Wallet },
    { name: "Packages", path: createPageUrl("Packages"), icon: Package },
    { name: "Favorites", path: createPageUrl("Favorites"), icon: Heart },
  ];

  const ProfileAvatar = ({ size = "w-12 h-12", textSize = "text-lg" }) => (
    <div className={`rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center text-white font-semibold ${size} ${textSize} overflow-hidden`}>
      {user?.profile_picture_url ? (
        <img src={user.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
      ) : (
        user?.first_name?.[0] || "U"
      )}
    </div>
  );

  const mainNavPages = ["Home", "Explore", "Calendar", "Packages"];
  const isMainPage = mainNavPages.includes(currentPageName);
  
  const handleDrawerNavigate = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };

  return (
    <div className={`min-h-screen bg-[#FAFAF9] ${isMainPage ? 'pb-24' : ''}`}>
      <style>{`
        :root {
          --primary-500: #3B82F6;
          --primary-600: #2563EB;
          --primary-700: #1D4ED8;
          --success-500: #10B981;
          --warning-500: #F59E0B;
          --error-500: #EF4444;
        }
      `}</style>

      {/* Profile Avatar - Top Left */}
      {isMainPage && (
        <div className="fixed top-5 left-4 z-50">
          <button
            onClick={() => setDrawerOpen(true)}
            className="hover:scale-105 transition-transform"
          >
            <ProfileAvatar />
          </button>
        </div>
      )}

      {/* Spotify-style Profile Drawer with Animation */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar size="w-16 h-16" textSize="text-2xl" />
                    <div>
                      <h2 className="font-bold text-xl text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Links */}
                <nav className="space-y-1">
                  {drawerItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleDrawerNavigate(item.path + (item.hash || ""))}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <item.icon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      <span className="font-medium text-gray-700 group-hover:text-gray-900">
                        {item.name}
                      </span>
                    </button>
                  ))}
                  
                  <button
                    onClick={() => fitzy.auth.logout()}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors group mt-4"
                  >
                    <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
                    <span className="font-medium text-gray-700 group-hover:text-red-600">
                      Logout
                    </span>
                  </button>
                </nav>

                {/* Version Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-400 text-center">FITZY v1.0.0</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-md mx-auto">
        {children}
      </main>

      {/* Bottom Tab Navigation */}
      {isMainPage && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-100 z-30">
          <div className="max-w-md mx-auto flex items-center justify-around px-2 h-20 safe-area-bottom">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[70px] transition-colors rounded-lg"
                >
                  <item.icon 
                    className={`w-6 h-6 transition-colors ${
                      isActive ? "text-blue-600" : "text-gray-400"
                    }`}
                  />
                  <span 
                    className={`text-xs font-semibold transition-colors ${
                      isActive ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

