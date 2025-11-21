
import React, { useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getLocalToday, fromCategorySlug, toCategorySlug, isCourtVenue } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { fitzy } from "@/api/fitzyClient";
import { format, isSameDay } from "date-fns";
import { ChevronLeft, Clock, User as UserIcon, Building, Tag, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DateStrip from "../components/shared/DateStrip";
import CheckoutSheet from "../components/checkout/CheckoutSheet";

export default function CategorySchedulePage() {
  const navigate = useNavigate();
  const { categorySlug = "" } = useParams();
  const location = useLocation();
  const legacyCategory = new URLSearchParams(location.search).get("category");
  const effectiveSlug = categorySlug || (legacyCategory ? toCategorySlug(legacyCategory) : "");
  const categoryName = legacyCategory || fromCategorySlug(effectiveSlug) || "Classes";

  const [activeTab, setActiveTab] = useState("classes");
  const [selectedDate, setSelectedDate] = useState(() => getLocalToday());
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // Can be a session or a package
  
  const { data: classTypes = [] } = useQuery({ queryKey: ['classTypes'], queryFn: () => fitzy.entities.ClassType.list() });
  const { data: venues = [] } = useQuery({ queryKey: ['venues'], queryFn: () => fitzy.entities.Venue.list() });
  const { data: allSessions = [] } = useQuery({ queryKey: ['allSessions'], queryFn: () => fitzy.entities.Session.list() });
  const { data: allPackages = [] } = useQuery({ queryKey: ['packages'], queryFn: () => fitzy.entities.Package.list() });
  
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

  const filteredSessions = useMemo(() => {
    return allSessions
      .filter((s) => {
        if (!isSameDay(new Date(s.start_datetime), selectedDate)) {
          return false;
        }
        if (classType) {
          return s.class_type_id === classType.id;
        }
        return matchingVenueIds.has(String(s.venue_id));
      })
      .filter((s) => {
        const hostVenue = venues.find((v) => String(v.id) === String(s.venue_id));
        return hostVenue ? !isCourtVenue(hostVenue) : false;
      })
      .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
  }, [classType, allSessions, selectedDate, venues, matchingVenueIds]);
  
  const filteredPackages = useMemo(() => {
    if (classType) {
      return allPackages.filter(
        (p) =>
          p.category_name === categoryName ||
          (!p.category_name && !p.venue_id)
      );
    }

    return allPackages.filter((p) => {
      if (p.category_name) {
        return toCategorySlug(p.category_name) === effectiveSlug.toLowerCase();
      }
      return matchingVenueIds.has(String(p.venue_id));
    });
  }, [classType, allPackages, categoryName, matchingVenueIds, effectiveSlug]);

  const handleBookSession = (session) => {
    setSelectedItem(session);
    setShowCheckout(true);
  };
  
  const handleBuyPackage = (pkg) => {
     alert("Package purchase flow not implemented yet.");
  };

  const selectedSessionVenue = selectedItem && activeTab === 'classes'
    ? venues.find((v) => String(v.id) === String(selectedItem.venue_id))
    : null;

  if (!classType && matchingVenueIds.size === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <p className="text-2xl font-semibold text-gray-900">Category not found</p>
          <p className="text-gray-500">Please select another class category.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8 bg-gray-50">
      <div className="px-4">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="text-3xl font-bold text-gray-900">{categoryName} Schedule</h1>
        </div>

        <div className="flex border-b border-gray-200 mb-6">
          <button onClick={() => setActiveTab("classes")} className={`relative py-3 px-4 text-base font-semibold transition-colors ${activeTab === "classes" ? "text-brand-600" : "text-gray-500 hover:text-gray-700"}`}>
            Classes
            {activeTab === "classes" && <motion.div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-600" layoutId="catScheduleUnderline" />}
          </button>
          <button onClick={() => setActiveTab("packages")} className={`relative py-3 px-4 text-base font-semibold transition-colors ${activeTab === "packages" ? "text-brand-600" : "text-gray-500 hover:text-gray-700"}`}>
            Packages
            {activeTab === "packages" && <motion.div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-600" layoutId="catScheduleUnderline" />}
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
                       <p className="text-xs text-brand-600 font-medium">{session.credit_cost} credits</p>
                    </div>
                  </div>
                   <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs font-medium ${isFull ? "text-red-600" : "text-green-600"}`}>
                        {isFull ? "Full" : `${capacityLeft} spot${capacityLeft > 1 ? 's' : ''} left`}
                      </span>
                      <button onClick={() => handleBookSession(session)} disabled={isFull} className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${isFull ? 'bg-gray-200 text-gray-600' : 'bg-brand-600 text-white hover:bg-brand-700'}`}>
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
                if (venue) return <div className="flex items-center gap-1.5 bg-brand-100 text-brand-700 text-xs font-semibold px-2 py-1 rounded-full"><Building className="w-3 h-3" />{venue.name}</div>;
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
                  <button onClick={() => handleBuyPackage(pkg)} className="px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors">
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
