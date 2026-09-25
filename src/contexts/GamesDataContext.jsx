import { createContext, useMemo } from 'react';
import { getGamesQuery } from '../services/gamesService';
import { useFirestoreSubscription } from '../hooks/useFirestoreSubscription';

const GamesDataContext = createContext(null);

const buildSuggestions = (games) => {
  const locations = new Set();
  const playerNames = new Set();

  games.forEach((game) => {
    if (game.location) locations.add(game.location);
    (game.players || []).forEach((player) => {
      if (player.name) playerNames.add(player.name);
    });
  });

  return {
    locations: Array.from(locations).sort(),
    playerNames: Array.from(playerNames).sort(),
  };
};

// 已批准 app 全程只建立一條 games listener，route 轉換時重用同一份資料。
export function GamesDataProvider({ userId, children }) {
  const subscription = useFirestoreSubscription(getGamesQuery, {
    enabled: Boolean(userId),
    deps: [userId],
    // 首次 invite approval 後 Firestore Rules 有短暫同步延遲時，只重試一次。
    retryConfig: {
      maxAttempts: 1,
      initialDelayMs: 700,
      retryableCodes: ['permission-denied', 'unavailable'],
    },
  });

  const suggestions = useMemo(() => buildSuggestions(subscription.data), [subscription.data]);
  const value = useMemo(
    () => ({ ...subscription, suggestions }),
    [subscription, suggestions]
  );

  return <GamesDataContext.Provider value={value}>{children}</GamesDataContext.Provider>;
}

export { GamesDataContext };
