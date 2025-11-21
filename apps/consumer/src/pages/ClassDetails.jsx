import React, { useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fitzy } from "@/api/fitzyClient";
import { ChevronLeft, Clock, MapPin, User as UserIcon, Info } from "lucide-react";
import { format } from "date-fns";
import CheckoutSheet from "../components/checkout/CheckoutSheet";

export default function ClassDetailsPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const location = useLocation();
  const legacyVenueId = new URLSearchParams(location.search).get("venueId");
  const [showCheckout, setShowCheckout] = useState(false);

  const { data: session, isLoading: loadingSession } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => fitzy.entities.Session.show(sessionId),
    enabled: Boolean(sessionId),
  });

  const venueId = useMemo(() => legacyVenueId ?? session?.venue_id, [session, legacyVenueId]);

  const { data: venue } = useQuery({
    queryKey: ["class-venue", venueId],
    queryFn: () => (venueId ? fitzy.entities.Venue.show(venueId) : null),
    enabled: Boolean(venueId),
  });

  const { data: classType } = useQuery({
    queryKey: ["class-type", session?.class_type_id],
    queryFn: () => (session?.class_type_id ? fitzy.entities.ClassType.show(session.class_type_id) : null),
    enabled: Boolean(session?.class_type_id),
  });

  if (loadingSession || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        Loading class…
      </div>
    );
  }

  const start = new Date(session.start_datetime);
  const end = new Date(session.end_datetime);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-3xl mx-auto pt-20 px-4 space-y-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white shadow hover:bg-slate-50"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <header className="bg-white rounded-3xl shadow-sm border border-white p-6 space-y-4">
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {format(start, "EEEE, MMM d · h:mm a")} – {format(end, "h:mm a")}
          </p>
          <h1 className="text-3xl font-bold text-gray-900">{session.name}</h1>
          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
            <span className="px-3 py-1 rounded-full bg-slate-100 font-semibold">
              {classType?.name || "Class"}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100">
              {session.level || "All levels"}
            </span>
          </div>
        </header>

        <section className="bg-white rounded-3xl border border-white shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Class details</h2>
          <div className="flex flex-col gap-3 text-sm text-gray-700">
            <div className="flex items-center gap-3">
              <UserIcon className="w-4 h-4 text-gray-500" />
              <span>Coach: {session.coach_name || session.instructor?.name || "Team Fitzy"}</span>
            </div>
            {venue && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>
                  {venue.name} · {[venue.address, venue.neighborhood, venue.city]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Info className="w-4 h-4 text-gray-500" />
              <span>
                {session.description ||
                  "High-intensity class focused on form, core strength, and mindful movement."}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
            <div>
              <p className="text-xs uppercase text-gray-500">Price</p>
              <p className="text-3xl font-bold text-gray-900">${session.price}</p>
              <p className="text-xs text-brand-600 font-semibold">{session.credit_cost} credits</p>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              disabled={!venue}
              className={`px-6 py-3 rounded-2xl font-semibold text-sm ${
                venue ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              Book class
            </button>
          </div>
        </section>
      </div>

      {showCheckout && venue && (
        <CheckoutSheet
          session={session}
          venue={venue}
          classType={classType}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}
