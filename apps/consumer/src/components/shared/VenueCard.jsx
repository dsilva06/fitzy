import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fitzy } from '@/api/fitzyClient';
import { format, isSameDay } from 'date-fns';
import { Clock, User as UserIcon, Heart, ChevronDown, ChevronUp, Star, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

export default function VenueCard({ venue, selectedDate, onSessionSelect, onWaitlistClick, isInitiallyExpanded = true }) {
    const queryClient = useQueryClient();
    const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => fitzy.auth.me(),
    });

    const { data: sessions, isLoading: sessionsLoading } = useQuery({
        queryKey: ['sessionsForVenue', venue.id, selectedDate],
        queryFn: async () => {
            const allSessions = await fitzy.entities.Session.filter({ venue_id: venue.id }, "start_datetime");
            return allSessions.filter(s => isSameDay(new Date(s.start_datetime), selectedDate));
        },
        enabled: !!venue && isExpanded,
    });

    const { data: classTypes } = useQuery({
        queryKey: ['classTypes'],
        queryFn: () => fitzy.entities.ClassType.list(),
    });

    const { data: favorite } = useQuery({
        queryKey: ['favoriteStatus', venue.id, user?.id],
        queryFn: async () => {
            if (!user) return null;
            const favorites = await fitzy.entities.Favorite.filter({ user_id: user.id, venue_id: venue.id });
            return favorites[0];
        },
        enabled: !!user,
    });

    const favoriteMutation = useMutation({
        mutationFn: async () => {
            if (favorite) {
                await fitzy.entities.Favorite.delete(favorite.id);
            } else {
                await fitzy.entities.Favorite.create({ user_id: user.id, venue_id: venue.id });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['favoriteStatus', venue.id, user?.id] });
        },
    });

    const handleFavoriteToggle = (e) => {
        e.stopPropagation();
        favoriteMutation.mutate();
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <header className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                         {venue.logo_url ? (
                            <img src={venue.logo_url} alt={venue.name} className="w-16 h-16 rounded-xl object-cover" />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                                <MapPin className="w-8 h-8 text-gray-400" />
                            </div>
                        )}
                        <div>
                            <h3 className="font-bold text-lg text-gray-900">{venue.name}</h3>
                            <p className="text-sm text-gray-600">{venue.neighborhood}</p>
                            {venue.rating && (
                                <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <span className="font-semibold">{venue.rating.toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <button onClick={handleFavoriteToggle} className="p-2">
                            <Heart className={`w-6 h-6 transition-all ${favorite ? 'text-red-500 fill-red-500' : 'text-gray-300'}`} />
                        </button>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {isExpanded && (
                    <motion.section
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-3">
                            {sessionsLoading && <p className="text-center text-gray-500 py-4">Loading schedule...</p>}
                            {!sessionsLoading && sessions?.map((session) => {
                                const classType = classTypes?.find(c => c.id === session.class_type_id);
                                const capacityLeft = session.capacity_total - session.capacity_taken;
                                const isFull = capacityLeft <= 0;

                                return (
                                    <div key={session.id} className="border-t border-gray-100 pt-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-gray-800">{classType?.name || 'Class'}</h4>
                                                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                                    <div className="flex items-center gap-1"><Clock className="w-3 h-3" /><span>{format(new Date(session.start_datetime), "h:mm a")}</span></div>
                                                    <div className="flex items-center gap-1"><UserIcon className="w-3 h-3" /><span>{session.coach_name}</span></div>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0 pl-2">
                                                <p className="font-bold text-gray-800">${session.price}</p>
                                                <p className="text-xs text-blue-600 font-medium">{session.credit_cost} credits</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className={`text-xs font-medium ${isFull ? "text-red-600" : "text-green-600"}`}>
                                              {isFull ? "Full" : `${capacityLeft} spot${capacityLeft > 1 ? 's' : ''} left`}
                                            </span>
                                            <button
                                                onClick={() => isFull ? onWaitlistClick(session) : onSessionSelect(session)}
                                                className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${isFull ? 'bg-gray-200 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                            >
                                                {isFull ? "Waitlist" : "Book"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                             {!sessionsLoading && sessions?.length === 0 && (
                                <p className="text-center text-gray-500 py-4">No classes scheduled for today.</p>
                             )}
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>
        </div>
    );
}