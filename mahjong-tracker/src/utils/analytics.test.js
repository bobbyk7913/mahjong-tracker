import { describe, expect, it } from 'vitest';
import { calculatePlayerStats } from './analytics';

const timestamp = (ms) => ({ toMillis: () => ms });

const game = (createdAtMs, players) => ({
  date: '2026-09-25',
  createdAt: timestamp(createdAtMs),
  players,
});

describe('calculatePlayerStats', () => {
  it('calculates totals, wins, extremes, and newest-first recent scores', () => {
    const records = [
      game(100, [{ name: 'A', score: -20 }, { name: 'B', score: 20 }]),
      game(300, [{ name: 'A', score: 10 }, { name: 'B', score: -10 }]),
      game(200, [{ name: 'A', score: 5 }, { name: 'C', score: -5 }]),
      game(400, [{ name: 'A', score: 40 }, { name: 'C', score: -40 }]),
    ];

    const { sortedPlayers } = calculatePlayerStats(records);
    const a = sortedPlayers.find(([name]) => name === 'A')[1];
    const b = sortedPlayers.find(([name]) => name === 'B')[1];
    const c = sortedPlayers.find(([name]) => name === 'C')[1];

    expect(a).toMatchObject({ total: 35, games: 4, wins: 3, maxWin: 40, maxLoss: -20 });
    expect(a.recentScores).toEqual([40, 10, 5]);
    expect(b).toMatchObject({ total: 10, games: 2, wins: 1, maxWin: 20, maxLoss: -10 });
    expect(c).toMatchObject({ total: -45, games: 2, wins: 0, maxWin: 0, maxLoss: -40 });
  });

  it('calculates best and worst partners from shared-game averages', () => {
    const records = [
      game(100, [{ name: 'A', score: 40 }, { name: 'B', score: -20 }, { name: 'D', score: -20 }]),
      game(200, [{ name: 'A', score: -30 }, { name: 'C', score: 40 }, { name: 'D', score: -10 }]),
    ];

    const { playerRelations } = calculatePlayerStats(records);

    expect(playerRelations.A.best.partner).toBe('B');
    expect(playerRelations.A.best.avg).toBe(40);
    expect(playerRelations.A.worst.partner).toBe('C');
    expect(playerRelations.A.worst.avg).toBe(-30);
  });

  it('handles empty records', () => {
    expect(calculatePlayerStats([])).toEqual({ sortedPlayers: [], playerRelations: {} });
  });
});
