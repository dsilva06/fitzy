
import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl, getLocalToday } from "@/utils";
import { fitzy } from "@/api/fitzyClient";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Clock, Heart, Package, Compass } from "lucide-react";
import { format, isAfter, isBefore, addHours } from "date-fns";

export default function HomePage() {
  const navigate = useNavigate();
  const today = getLocalToday();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => fitzy.auth.me(),
  });

  const { data: bookings } = useQuery({
    queryKey: ['upcomingBookings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const allBookings = await fitzy.entities.Booking.filter({ 
        user_id: user.id,
        status: "confirmed"
      }, "-created_date");
      
      const sessions = await fitzy.entities.Session.list();
      
      return allBookings
        .map(booking => {
            const session = sessions.find(s => s.id === booking.session_id);
            return { ...booking, session };
        })
        .filter(b => b.session && isAfter(new Date(b.session.start_datetime), today))
        .sort((a,b) => new Date(a.session.start_datetime) - new Date(b.session.start_datetime));
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => fitzy.entities.Session.list("start_datetime", 100),
    initialData: [],
  });

  const { data: venues } = useQuery({
    queryKey: ['venues'],
    queryFn: () => fitzy.entities.Venue.list(),
    initialData: [],
  });

  const nextBooking = bookings[0];
  const nextSession = nextBooking?.session;
  const nextVenue = nextSession ? venues.find(v => v.id === nextSession.venue_id) : null;

  const monthlyClasses = bookings.length;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-1">
          {greeting()}, {user?.first_name || "there"}
        </h1>
        <p className="text-lg text-gray-600">Ready to move?</p>
      </div>

      {/* Next Class Card or Empty State */}
      {nextSession && nextVenue ? (
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-6 mb-10 text-white shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-brand-100 text-sm font-medium mb-1">Next Class</p>
              <h2 className="text-2xl font-bold mb-2">{nextSession.name}</h2>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full">
              <p className="text-sm font-semibold">{format(new Date(nextSession.start_datetime), 'MMM d')}</p>
            </div>
          </div>

          <div className="space-y-3.5 mb-6">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 opacity-80" />
              <span className="font-medium">{nextVenue.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 opacity-80" />
              <span>
                {format(new Date(nextSession.start_datetime), "h:mm a")} - {format(new Date(nextSession.end_datetime), "h:mm a")}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => navigate(createPageUrl("ReservationDetails") + `?bookingId=${nextBooking.id}`)}
              className="flex-1 bg-white text-brand-600 font-bold py-3.5 rounded-2xl hover:bg-brand-50 transition-colors"
            >
              Open details
            </button>
            <button className="px-6 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-2xl hover:bg-white/30 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 mb-10 text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 mx-auto mb-5 bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="font-bold text-xl text-gray-800 mb-2">No Upcoming Classes</h3>
          <p className="text-gray-500">This month: {monthlyClasses} classes</p>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="font-bold text-xl text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate(createPageUrl("Explore"))}
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg border border-gray-100 hover:border-transparent transition-all text-left"
          >
            <div className="w-12 h-12 bg-brand-100 rounded-2xl flex items-center justify-center mb-4">
              <Compass className="w-6 h-6 text-brand-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Explore Today</h4>
            <p className="text-sm text-gray-600">Find classes near you</p>
          </button>

          <button
            onClick={() => navigate(createPageUrl("Favorites"))}
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg border border-gray-100 hover:border-transparent transition-all text-left"
          >
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Favorites</h4>
            <p className="text-sm text-gray-600">Quick rebooking</p>
          </button>

          <button
            onClick={() => navigate(createPageUrl("Profile") + "#packages")}
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg border border-gray-100 hover:border-transparent transition-all text-left col-span-2"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Packages</h4>
            <p className="text-sm text-gray-600">View your credits and buy packages</p>
          </button>
        </div>
      </div>
    </div>
  );
}
