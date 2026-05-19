import { useMemo } from 'react';
import type { Attraction } from '../types';
import { isNearby, sortByDistance } from '../utils/geo';
import { usePlayHistory } from './usePlayHistory';

export function useNearbyAttractions(
  userLocation: number[] | null,
  allAttractions: Attraction[],
) {
  const { hasPlayedToday } = usePlayHistory();

  const nearby = useMemo(() => {
    if (!userLocation) return [];
    const inRange = allAttractions.filter((a) => isNearby(userLocation, a));
    return sortByDistance(userLocation, inRange);
  }, [userLocation, allAttractions]);

  const unplayedNearby = useMemo(() => {
    return nearby.filter((a) => !hasPlayedToday(a.id));
  }, [nearby, hasPlayedToday]);

  const nearestUnplayed = unplayedNearby.length > 0 ? unplayedNearby[0] : null;

  return { nearby, unplayedNearby, nearestUnplayed };
}
