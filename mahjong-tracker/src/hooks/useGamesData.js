import { useContext } from 'react';
import { GamesDataContext } from '../contexts/GamesDataContext';

export function useGamesData() {
  const value = useContext(GamesDataContext);
  if (!value) throw new Error('useGamesData must be used within GamesDataProvider');
  return value;
}