import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fitzy } from "@/api/fitzyClient";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, MapPin, Clock, User as UserIcon } from "lucide-react";
import { format, isSameDay } from "date-fns";
import DateStrip from "../components/shared/DateStrip";
import CheckoutSheet from "../components/checkout/CheckoutSheet";

export default function VenueSchedulePage() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const venueId = urlParams.get('venueId');

  const [activeTab, setActiveTab] = useState("classes");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const { data: venue } = useQuery({
    queryKey: ['venue', venueId],
    queryFn: async () => {
      const venues = await fitzy.entities.Venue.list();
      return venues.find(v => v.id === venueId);
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ['sessions', venueId, selectedDate],
    queryFn: async () => {
      const allSessions = await fitzy.entities.Session.filter({ venue_id: venueId }, "start_datetime");
      return allSessions.filter(s => isSameDay(new Date(s.start_datetime), selectedDate));
    },
    initialData: [],
  });

  const { data: classTypes } = useQuery({
    queryKey: ['classTypes'],
    queryFn: () => fitzy.entities.ClassType.list(),
    initialData: [],
  });

  const { data: packages } = useQuery({
    queryKey: ['packages', venueId],
    queryFn: () => fitzy.entities.Package.filter({ venue_id: venueId }),
    initialData: [],
  });

  if (!venue) {
    return <div className="min-h-screen pt-20 px-4">Loading...</div>;
  }

  const handleBookSession = (session) => {
    setSelectedSession(session);
    setShowCheckout(true);
  };

  const selectedSessionClassType = selectedSession
    ? classTypes.find(c => c.id === selectedSession.class_type_id)
    : null;

  return (
    <div className="min-h-screen pt-20 pb-8">
      {/* Header */}
      <div className="px-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 p-2 hover:bg-gray-100 rounded-lg transition-colors inline-flex"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex items-start gap-4">
          {venue.logo_url ? (
            <img 
              src={venue.logo_url} 
              alt={venue.name}
              className="w-20 h-20 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-2xl">
              {venue.name[0]}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{venue.name}</h1>
            <div className="flex items-center gap-2 text-gray-600 mt-1">
              <MapPin className="w-4 h-4" />
              <span>{venue.neighborhood}, {venue.city}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 px-4">
        <button
          onClick={() => setActiveTab("classes")}
          className={`flex-1 py-3 rounded-2xl font-semibold transition-colors ${
            activeTab === "classes"
              ? "bg-brand-600 text-white"
              : "bg-white text-gray-600"
          }`}
        >
          Classes
        </button>
        <button
          onClick={() => setActiveTab("packages")}
          className={`flex-1 py-3 rounded-2xl font-semibold transition-colors ${
            activeTab === "packages"
              ? "bg-brand-600 text-white"
              : "bg-white text-gray-600"
          }`}
        >
          Packages
        </button>
      </div>

      {activeTab === "classes" ? (
        <>
          <DateStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />
          
          <div className="px-4 mt-6 space-y-3">
            {sessions.map((session) => {
              const classType = classTypes.find(c => c.id === session.class_type_id);
              const capacityLeft = session.capacity_total - session.capacity_taken;
              const isFull = capacityLeft <= 0;

              return (
                <div key={session.id} className="bg-white rounded-2xl p-4 shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {classType?.name || "Class"}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{format(new Date(session.start_datetime), "h:mm a")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <UserIcon className="w-4 h-4" />
                          <span>{session.coach_name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">${session.price}</p>
                      <p className="text-sm text-gray-600">{session.credit_cost} credits</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      isFull ? "text-red-600" : capacityLeft <= 3 ? "text-orange-600" : "text-green-600"
                    }`}>
                      {isFull ? "Full" : `${capacityLeft} spots left`}
                    </span>
                    <button
                      onClick={() => handleBookSession(session)}
                      disabled={isFull}
                      className={`px-6 py-2 rounded-xl font-semibold transition-colors ${
                        isFull
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-brand-600 text-white hover:bg-brand-700"
                      }`}
                    >
                      {isFull ? "Join Waitlist" : "Book"}
                    </button>
                  </div>
                </div>
              );
            })}

            {sessions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No classes available for this date
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="px-4 space-y-4">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="font-bold text-xl text-gray-900 mb-2">{pkg.name}</h3>
              <p className="text-gray-600 mb-4">Valid for {pkg.validity_months} months</p>
              <div className="flex justify-between items-center">
                <span className="text-3xl font-bold text-gray-900">${pkg.price}</span>
                <button className="px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors">
                  Buy Package
                </button>
              </div>
            </div>
          ))}

          {packages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No packages available
            </div>
          )}
        </div>
      )}

      {/* Checkout Sheet */}
      {showCheckout && selectedSession && (
        <CheckoutSheet
          session={selectedSession}
          venue={venue}
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