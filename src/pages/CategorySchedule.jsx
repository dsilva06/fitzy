
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, isSameDay } from "date-fns";
import { ChevronLeft, Clock, User as UserIcon, Building, Tag, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DateStrip from "../components/shared/DateStrip";
import CheckoutSheet from "../components/checkout/CheckoutSheet";

const DEMO_TODAY = new Date('2024-08-01T12:00:00Z');

export default function CategorySchedulePage() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const categoryName = urlParams.get('category');

  const [activeTab, setActiveTab] = useState("classes");
  const [selectedDate, setSelectedDate] = useState(DEMO_TODAY);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // Can be a session or a package
  
  const { data: classTypes = [] } = useQuery({ queryKey: ['classTypes'], queryFn: () => base44.entities.ClassType.list() });
  const { data: venues = [] } = useQuery({ queryKey: ['venues'], queryFn: () => base44.entities.Venue.list() });
  const { data: allSessions = [] } = useQuery({ queryKey: ['allSessions'], queryFn: () => base44.entities.Session.list() });
  const { data: allPackages = [] } = useQuery({ queryKey: ['packages'], queryFn: () => base44.entities.Package.list() });
  
  const classType = useMemo(() => classTypes.find(c => c.name === categoryName), [classTypes, categoryName]);

  const filteredSessions = useMemo(() => {
    if (!classType) return [];
    return allSessions
      .filter(s => s.class_type_id === classType.id && isSameDay(new Date(s.start_datetime), selectedDate))
      .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
  }, [classType, allSessions, selectedDate]);
  
  const filteredPackages = useMemo(() => {
    if (!classType) return [];
    return allPackages.filter(p => p.category_name === categoryName || !p.category_name);
  }, [classType, allPackages]);

  const handleBookSession = (session) => {
    setSelectedItem(session);
    setShowCheckout(true);
  };
  
  const handleBuyPackage = (pkg) => {
     alert("Package purchase flow not implemented yet.");
  };

  const selectedSessionVenue = selectedItem && activeTab === 'classes'
    ? venues.find(v => v.id === selectedItem.venue_id)
    : null;

  return (
    <div className="min-h-screen pt-20 pb-8 bg-gray-50">
      <div className="px-4">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="text-3xl font-bold text-gray-900">{categoryName} Schedule</h1>
        </div>

        <div className="flex border-b border-gray-200 mb-6">
          <button onClick={() => setActiveTab("classes")} className={`relative py-3 px-4 text-base font-semibold transition-colors ${activeTab === "classes" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
            Classes
            {activeTab === "classes" && <motion.div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" layoutId="catScheduleUnderline" />}
          </button>
          <button onClick={() => setActiveTab("packages")} className={`relative py-3 px-4 text-base font-semibold transition-colors ${activeTab === "packages" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
            Packages
            {activeTab === "packages" && <motion.div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" layoutId="catScheduleUnderline" />}
          </button>
        </div>
      </div>

      {activeTab === 'classes' ? (
        <>
          <div className="pb-4">
            <DateStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />
          </div>
          <div className="px-4 mt-2 space-y-3">
            {filteredSessions.length > 0 ? filteredSessions.map(session => {
              const venue = venues.find(v => v.id === session.venue_id);
              const capacityLeft = session.capacity_total - session.capacity_taken;
              const isFull = capacityLeft <= 0;
              return (
                <div key={session.id} className="bg-white p-4 rounded-2xl shadow-sm border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg">{format(new Date(session.start_datetime), "h:mm a")} - {format(new Date(session.end_datetime), "h:mm a")}</p>
                      <p className="text-sm text-gray-600 font-medium">{venue?.name || 'Unknown Venue'}</p>
                      <p className="text-xs text-gray-500 mt-1">Coach: {session.coach_name}</p>
                    </div>
                    <div className="text-right">
                       <p className="font-bold text-gray-800">${session.price}</p>
                       <p className="text-xs text-blue-600 font-medium">{session.credit_cost} credits</p>
                    </div>
                  </div>
                   <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs font-medium ${isFull ? "text-red-600" : "text-green-600"}`}>
                        {isFull ? "Full" : `${capacityLeft} spot${capacityLeft > 1 ? 's' : ''} left`}
                      </span>
                      <button onClick={() => handleBookSession(session)} disabled={isFull} className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${isFull ? 'bg-gray-200 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                        {isFull ? "Waitlist" : "Book"}
                      </button>
                    </div>
                </div>
              )
            }) : (
              <div className="text-center py-16 text-gray-500">
                <p>No {categoryName} classes for this day.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="px-4 space-y-4">
           {filteredPackages.map(pkg => {
              const venue = venues.find(v => v.id === pkg.venue_id);
              const ScopeChip = () => {
                if (venue) return <div className="flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full"><Building className="w-3 h-3" />{venue.name}</div>;
                if (pkg.category_name) return <div className="flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded-full"><Tag className="w-3 h-3" />{pkg.category_name} only</div>;
                return <div className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full"><Globe className="w-3 h-3" />All venues</div>;
              };
             return (
              <div key={pkg.id} className="bg-white rounded-2xl p-5 shadow-sm border">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">{pkg.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">Valid for {pkg.validity_months} months</p>
                  </div>
                  <ScopeChip/>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-bold text-gray-900">${pkg.price}</span>
                  <button onClick={() => handleBuyPackage(pkg)} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                    Buy
                  </button>
                </div>
              </div>
            )
           })}
        </div>
      )}

      {showCheckout && selectedItem && activeTab === 'classes' && (
        <CheckoutSheet
          session={selectedItem}
          venue={selectedSessionVenue}
          classType={classType}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}
