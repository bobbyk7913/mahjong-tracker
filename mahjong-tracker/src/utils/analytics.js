const getCreatedAtMs = (game) => game.createdAt?.toMillis?.() ?? 0;

// Pure calculation: input records in, rendered Analytics data out.
// Sort by createdAt to preserve the existing "recent three games" behaviour.
export function calculatePlayerStats(records) {
  const stats = {};
  const synergy = {};
  const newestFirst = [...records].sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));

  newestFirst.forEach((game) => {
    (game.players || []).forEach((player) => {
      if (!stats[player.name]) {
        stats[player.name] = { total: 0, games: 0, wins: 0, maxWin: 0, maxLoss: 0, recentScores: [] };
      }

      const playerStats = stats[player.name];
      playerStats.total += player.score;
      playerStats.games += 1;
      if (player.score > 0) playerStats.wins += 1;
      if (player.score > playerStats.maxWin) playerStats.maxWin = player.score;
      if (player.score < playerStats.maxLoss) playerStats.maxLoss = player.score;
      if (playerStats.recentScores.length < 3) playerStats.recentScores.push(player.score);
    });

    (game.players || []).forEach((player) => {
      if (!synergy[player.name]) synergy[player.name] = {};
      (game.players || []).forEach((partner) => {
        if (player.name === partner.name) return;
        if (!synergy[player.name][partner.name]) {
          synergy[player.name][partner.name] = { totalWith: 0, gamesWith: 0 };
        }
        synergy[player.name][partner.name].totalWith += player.score;
        synergy[player.name][partner.name].gamesWith += 1;
      });
    });
  });

  const sortedPlayers = Object.entries(stats).sort(([, left], [, right]) => right.total - left.total);
  const playerRelations = {};

  Object.keys(synergy).forEach((playerName) => {
    const relations = Object.entries(synergy[playerName])
      .map(([partner, data]) => ({ partner, avg: data.totalWith / data.gamesWith }))
      .sort((left, right) => right.avg - left.avg);

    playerRelations[playerName] = {
      best: relations[0],
      worst: relations[relations.length - 1],
    };
  });

  return { sortedPlayers, playerRelations };
}
