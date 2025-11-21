import { useAuth } from "@/contexts/AuthProvider";
import { fitzy } from "@/api/fitzyClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useFavoriteVenue(venueId) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const rawVenueId = venueId ?? null;
  const normalizedVenueId = rawVenueId ? String(rawVenueId) : null;

  const favoriteQuery = useQuery({
    queryKey: ['favoriteStatus', user?.id ?? 'guest', normalizedVenueId],
    queryFn: async () => {
      if (!user || !normalizedVenueId) return null;
      const favorites = await fitzy.entities.Favorite.filter({
        user_id: user.id,
        venue_id: rawVenueId ?? normalizedVenueId,
      });
      return favorites[0] ?? null;
    },
    enabled: Boolean(user && normalizedVenueId),
    staleTime: 1000 * 30,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user || !normalizedVenueId) return;
      const currentFavorite = queryClient.getQueryData(['favoriteStatus', user.id ?? 'guest', normalizedVenueId]) ?? favoriteQuery.data;

      if (currentFavorite) {
        await fitzy.entities.Favorite.delete(currentFavorite.id);
      } else {
        await fitzy.entities.Favorite.create({
          user_id: user.id,
          venue_id: rawVenueId ?? normalizedVenueId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteStatus', user?.id ?? 'guest', normalizedVenueId] });
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });

  const toggleFavorite = () => {
    if (!user || !normalizedVenueId) {
      return false;
    }
    mutation.mutate();
    return true;
  };

  return {
    isFavorite: Boolean(favoriteQuery.data),
    favorite: favoriteQuery.data,
    toggleFavorite,
    isLoading: favoriteQuery.isLoading,
    isProcessing: mutation.isPending,
    canFavorite: Boolean(user),
  };
}
