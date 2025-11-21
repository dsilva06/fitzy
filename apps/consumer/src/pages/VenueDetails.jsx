import React, { useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fitzy } from "@/api/fitzyClient";
import {
  ChevronLeft,
  Heart,
  Share2,
  MapPin,
  Star,
  Instagram,
  Globe,
  Mail,
  Phone,
  Navigation,
} from "lucide-react";
import { isCourtVenue } from "@/utils";
import { useFavoriteVenue } from "@/hooks/useFavoriteVenue";

const heroFallback =
  "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&w=1400&q=60";

const defaultAmenities = ["Lockers", "Showers", "Towel service", "Parking", "Water refill station"];
const defaultReviews = [
  {
    user: "Daniela S.",
    date: "Nov 2024",
    rating: 5,
    comment: "Loved the energy of the instructors and the spotless studio.",
  },
  {
    user: "Carlos M.",
    date: "Oct 2024",
    rating: 4,
    comment: "Great variety of classes and super friendly team.",
  },
];

const defaultImages = [
  heroFallback,
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1400&q=60",
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=60",
];

export default function VenueDetailsPage() {
  const navigate = useNavigate();
  const { venueId: paramVenueId } = useParams();
  const location = useLocation();
  const legacyId = new URLSearchParams(location.search).get("venueId");
  const venueId = paramVenueId ?? legacyId;

  const { data: venue, isLoading } = useQuery({
    queryKey: ["venue-details", venueId],
    queryFn: async () => {
      if (!venueId) return null;
      return fitzy.entities.Venue.show(venueId);
    },
  });

  const { isFavorite, toggleFavorite } = useFavoriteVenue(venue?.id);
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading || !venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        Loading venue…
      </div>
    );
  }

  if (isCourtVenue(venue)) {
    navigate(`/complexes/${venueId}`, { replace: true });
    return null;
  }

  const galleryImages = useMemo(() => {
    const merged = [
      venue.cover_image_url,
      ...(venue.gallery_images ?? []),
      ...defaultImages,
    ]
      .filter(Boolean)
      .slice(0, 5);
    return merged.length ? merged : defaultImages;
  }, [venue]);

  const categories = venue.categories?.length ? venue.categories : ["Strength", "Cycling", "Yoga"];
  const amenities = venue.amenities?.length ? venue.amenities : defaultAmenities;
  const reviews = venue.reviews?.length ? venue.reviews : defaultReviews;

  const contactLinks = [
    {
      label: "Instagram",
      href: venue.instagram_url || "#",
      icon: Instagram,
    },
    {
      label: "Website",
      href: venue.website_url || "#",
      icon: Globe,
    },
    {
      label: venue.email || "hello@fitzy.app",
      href: `mailto:${venue.email || "hello@fitzy.app"}`,
      icon: Mail,
    },
    {
      label: venue.phone || "+1 555 FITZY",
      href: `tel:${venue.phone || "+155534899"}`,
      icon: Phone,
    },
  ];

  const handlePrev = () => {
    setActiveImage((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveImage((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32 relative">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="relative h-[360px] w-full overflow-hidden rounded-b-3xl bg-slate-200">
          <img
            src={galleryImages[activeImage]}
            alt={venue.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-4 z-10 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow"
          >
            <ChevronLeft className="w-5 h-5 text-slate-900" />
          </button>

          <div className="absolute inset-x-0 bottom-0 p-6 text-white space-y-2">
            <p className="uppercase tracking-[0.3em] text-white/70 text-xs">
              {venue.city || "Boutique studio"}
            </p>
            <h1 className="text-4xl font-bold">{venue.name}</h1>
            <div className="flex flex-wrap gap-2 text-sm text-white/80">
              {categories.map((category) => (
                <span key={category} className="px-3 py-1 rounded-full bg-white/20">
                  {category}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow"
          >
            ‹
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow"
          >
            ›
          </button>

          <div className="absolute bottom-4 right-4 flex gap-1">
            {galleryImages.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 w-6 rounded-full ${
                  index === activeImage ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="px-4 sm:px-6 space-y-10 mt-6">
          {/* Info + actions */}
          <section className="bg-white rounded-3xl shadow-sm p-6 border border-white space-y-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {[venue.address, venue.neighborhood, venue.city].filter(Boolean).join(" · ")}
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span key={category} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                    {category}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="flex-1 min-w-[140px] py-3 rounded-2xl bg-slate-100 font-semibold flex items-center justify-center gap-2"
                onClick={() => {
                  const handled = toggleFavorite();
                  if (!handled) alert("Log in to save venues to favorites.");
                }}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? "text-red-500 fill-red-500" : "text-slate-500"}`} />
                {isFavorite ? "Saved" : "Save"}
              </button>
              <button className="flex-1 min-w-[140px] py-3 rounded-2xl bg-slate-900 text-white font-semibold flex items-center justify-center gap-2">
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="text-lg font-semibold text-gray-900">
                  {venue.rating?.toFixed(1) ?? "4.9"}
                </span>
              </div>
              <span className="text-sm text-gray-500">{reviews.length} reviews</span>
            </div>
          </section>

          {/* Reviews */}
          <section className="bg-white rounded-3xl shadow-sm p-6 border border-white space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">What members say</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {reviews.map((review, idx) => (
                <div key={`${review.user}-${idx}`} className="min-w-[220px] max-w-xs bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">{review.user}</p>
                    <span className="text-xs text-gray-500">{review.date}</span>
                  </div>
                  <div className="flex gap-1 text-yellow-400">
                    {Array.from({ length: review.rating }).map((_, starIdx) => (
                      <Star key={starIdx} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                </div>
              ))}
            </div>
          </section>

          {/* About */}
          <section className="bg-white rounded-3xl shadow-sm p-6 border border-white space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">About this venue</h2>
            <p className="text-gray-600">
              {venue.description ||
                "Boutique studio focused on premium coaching, personalized guidance, and curated classes to keep you moving."}
            </p>
            <div className="flex flex-wrap gap-3">
              {contactLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-full border border-slate-200 text-sm font-medium flex items-center gap-2 hover:bg-slate-50"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </a>
              ))}
            </div>
          </section>

          {/* Amenities */}
          <section className="bg-white rounded-3xl shadow-sm p-6 border border-white space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Amenities</h2>
            <div className="flex flex-wrap gap-3">
              {amenities.map((amenity) => (
                <span key={amenity} className="px-4 py-2 bg-slate-100 rounded-2xl text-sm font-medium text-slate-700">
                  {amenity}
                </span>
              ))}
            </div>
          </section>

          {/* Location */}
          <section className="bg-white rounded-3xl shadow-sm p-6 border border-white space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">How to get there</h2>
                <p className="text-sm text-gray-500">
                  {venue.address || `${venue.neighborhood ?? ""}, ${venue.city ?? ""}`}
                </p>
              </div>
              <button className="px-4 py-2 rounded-full bg-slate-100 text-sm font-semibold flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                Open Maps
              </button>
            </div>
            <div className="h-48 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-gray-500">
              Map preview unavailable
            </div>
          </section>
        </div>
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-30 pointer-events-none">
        <button
          onClick={() => navigate(`/venues/${venueId}/schedule`)}
          className="w-full py-3 rounded-[24px] bg-brand-600 text-white text-base font-semibold shadow-xl border border-brand-600/70 hover:bg-brand-700 transition-colors pointer-events-auto"
        >
          View schedule
        </button>
      </div>
    </div>
  );
}
