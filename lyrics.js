export function parseSyncedLyrics(syncedLyrics) {
  if (!syncedLyrics) return [];

  return syncedLyrics
    .split("\n")
    .map((line) => {
      const match = line.match(/^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)$/);
      if (!match) return null;

      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const fractionRaw = match[3] || "0";
      const ms = fractionRaw.length === 2 ? Number(fractionRaw) * 10 : Number(fractionRaw);

      return {
        timeMs: minutes * 60000 + seconds * 1000 + ms,
        text: match[4].trim()
      };
    })
    .filter(Boolean);
}

export function getActiveLyricIndex(lines, positionMs) {
  if (!lines.length) return -1;

  for (let i = lines.length - 1; i >= 0; i--) {
    if (positionMs >= lines[i].timeMs) {
      return i;
    }
  }

  return -1;
}
