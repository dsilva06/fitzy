
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { fitzy } from "@/api/fitzyClient";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format, isAfter, isBefore, differenceInDays } from "date-fns";
import { Package as PackageIcon, Building, Tag, Globe, History, Trash2, Undo2 } from "lucide-react";

const PackageCard = ({ ownership, pkg, venue, onCardClick, onBuyAgain, onHide, isExpired = false }) => {
  const isExpiringSoon = !isExpired && differenceInDays(new Date(ownership.expires_at), new Date()) <= 7;

  const ScopeChip = () => {
    if (venue) {
      return <div className="flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full"><Building className="w-3 h-3" />{venue.name}</div>;
    }
    if (pkg.category_name) {
      return <div className="flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded-full"><Tag className="w-3 h-3" />{pkg.category_name}</div>;
    }
    return <div className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full"><Globe className="w-3 h-3" />All venues</div>;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-300 ${isExpired ? 'opacity-70' : 'hover:shadow-xl'}`}
    >
      <button 
        onClick={() => !isExpired && onCardClick()} 
        disabled={isExpired}
        className="w-full text-left p-5 block disabled:cursor-default"
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-lg text-gray-900">{pkg.name}</h3>
          <ScopeChip />
        </div>

        {!isExpired && (
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-4xl font-bold text-blue-600">{ownership.credits_remaining}</span>
            <span className="text-gray-600 font-medium">credits left</span>
          </div>
        )}

        <div className={`text-sm font-medium rounded-lg p-2 inline-block ${isExpiringSoon ? 'bg-orange-50 text-orange-600' : 'text-gray-500'}`}>
          {isExpired 
            ? `Expired on ${format(new Date(ownership.expires_at), "MMM d, yyyy")}`
            : `Expires ${format(new Date(ownership.expires_at), "MMM d, yyyy")}`
          }
        </div>

        {isExpired && (
          <p className="text-sm text-gray-500 mt-1">
            Used {pkg.total_credits - ownership.credits_remaining} of {pkg.total_credits} credits
          </p>
        )}
      </button>
      
      {isExpired && (
        <div className="bg-gray-50 px-5 py-3 flex items-center justify-end gap-2 border-t">
          <button onClick={onHide} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600 p-2 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
            Hide
          </button>
          <button onClick={onBuyAgain} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm hover:bg-blue-700 transition-colors">
            Buy again
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default function PackagesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("active");
  const [hiddenIds, setHiddenIds] = useState([]);
  const [lastHiddenId, setLastHiddenId] = useState(null);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => fitzy.auth.me() });
  const { data: ownerships = [] } = useQuery({
    queryKey: ['packageOwnerships', user?.id],
    queryFn: () => fitzy.entities.PackageOwnership.filter({ user_id: user.id }, "-purchased_at"),
    enabled: !!user,
  });
  const { data: packages = [] } = useQuery({ queryKey: ['packages'], queryFn: () => fitzy.entities.Package.list() });
  const { data: venues = [] } = useQuery({ queryKey: ['venues'], queryFn: () => fitzy.entities.Venue.list() });

  const { activePackages, expiredPackages } = useMemo(() => {
    const now = new Date();
    const active = ownerships
      .filter(o => isAfter(new Date(o.expires_at), now))
      .sort((a, b) => new Date(a.expires_at) - new Date(b.expires_at) || a.credits_remaining - b.credits_remaining);
    
    const expired = ownerships
      .filter(o => isBefore(new Date(o.expires_at), now) && !hiddenIds.includes(o.id))
      .sort((a, b) => new Date(b.expires_at) - new Date(a.expires_at));
      
    return { activePackages: active, expiredPackages: expired };
  }, [ownerships, hiddenIds]);

  const handleCardClick = (pkg) => {
    if (pkg.venue_id) {
      navigate(createPageUrl("VenueSchedule") + `?venueId=${pkg.venue_id}`);
    } else if (pkg.category_name) {
      navigate(createPageUrl("CategoryResults") + `?category=${encodeURIComponent(pkg.category_name)}`);
    } else {
      navigate(createPageUrl("Explore"));
    }
  };

  const handleHide = (id) => {
    setLastHiddenId(id);
    setHiddenIds(prev => [...prev, id]);
  };

  const handleUndoHide = () => {
    if (lastHiddenId) {
      setHiddenIds(prev => prev.filter(id => id !== lastHiddenId));
      setLastHiddenId(null);
    }
  };

  const tabs = [
    { id: 'active', label: 'Active' },
    { id: 'expired', label: expiredPackages.length > 0 ? `Expired (${expiredPackages.length})` : 'Expired' },
  ];

  const currentList = activeTab === 'active' ? activePackages : expiredPackages;

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Packages</h1>

      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative py-3 px-4 text-base font-semibold transition-colors ${
              activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                layoutId="packagesUnderline"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {currentList.length > 0 ? (
            <div className="space-y-4">
              <AnimatePresence>
                {currentList.map(ownership => {
                  const pkg = packages.find(p => p.id === ownership.package_id);
                  if (!pkg) return null;
                  const venue = venues.find(v => v.id === pkg.venue_id);
                  return (
                    <PackageCard
                      key={ownership.id}
                      ownership={ownership}
                      pkg={pkg}
                      venue={venue}
                      onCardClick={() => handleCardClick(pkg)}
                      onBuyAgain={() => handleCardClick(pkg)}
                      onHide={() => handleHide(ownership.id)}
                      isExpired={activeTab === 'expired'}
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === 'active' ? <PackageIcon className="w-10 h-10 text-gray-400" /> : <History className="w-10 h-10 text-gray-400" />}
              </div>
              <p className="font-semibold text-lg mb-1">
                {activeTab === 'active' ? "You don’t have any packages yet." : "No expired packages."}
              </p>
              {activeTab === 'active' && <p>When you get a package, it will appear here.</p>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      
      {lastHiddenId && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-4">
          <span>Package hidden.</span>
          <button onClick={handleUndoHide} className="flex items-center gap-1.5 font-semibold text-blue-300 hover:text-blue-200">
            <Undo2 className="w-4 h-4" />
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
