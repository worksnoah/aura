import { useEffect, useMemo, useState } from "react";
import {
  clearCodeFromUrl,
  exchangeCodeForToken,
  getAccessToken,
  getCodeFromUrl,
  loginWithSpotify,
  logout
} from "./lib/auth";
import { getCurrentlyPlaying } from "./lib/spotify";
import { fetchLyrics } from "./lib/lrclib";
import { extractGradientColors } from "./lib/colors";
import { getActiveLyricIndex, parseSyncedLyrics } from "./lib/lyrics";

function formatTime(ms) {
  const totalSeconds = Math.floor((ms || 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function App() {
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [track, setTrack] = useState(null);
  const [lyrics, setLyrics] = useState([]);
  const [progressMs, setProgressMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [colors, setColors] = useState([
    "rgb(34, 20, 64)",
    "rgb(11, 12, 24)",
    "rgb(88, 40, 140)",
    "rgb(18, 28, 54)"
  ]);

  useEffect(() => {
    async function handleAuth() {
      try {
        const code = getCodeFromUrl();

        if (code && !getAccessToken()) {
          await exchangeCodeForToken(code);
          clearCodeFromUrl();
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingAuth(false);
      }
    }

    handleAuth();
  }, []);

  useEffect(() => {
    if (!getAccessToken()) return;

    let cancelled = false;

    async function loadCurrentTrack() {
      try {
        const data = await getCurrentlyPlaying();

        if (!data || !data.item || cancelled) return;

        const nextTrack = {
          id: data.item.id,
          name: data.item.name,
          artist: data.item.artists?.map((artist) => artist.name).join(", "),
          album: data.item.album?.name,
          image: data.item.album?.images?.[0]?.url || "",
          durationMs: data.item.duration_ms
        };

        setTrack(nextTrack);
        setProgressMs(data.progress_ms || 0);
        setIsPlaying(Boolean(data.is_playing));
      } catch (error) {
        console.error(error);
      }
    }

    loadCurrentTrack();
    const interval = setInterval(loadCurrentTrack, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [loadingAuth]);

  useEffect(() => {
    if (!track?.image) return;

    extractGradientColors(track.image).then((nextColors) => {
      setColors(nextColors);
    });
  }, [track?.image]);

  useEffect(() => {
    if (!track) return;

    async function loadLyrics() {
      try {
        const data = await fetchLyrics({
          trackName: track.name,
          artistName: track.artist,
          albumName: track.album,
          duration: track.durationMs
        });

        const synced = data?.syncedLyrics || data?.synced_lyrics || "";
        setLyrics(parseSyncedLyrics(synced));
      } catch (error) {
        console.error(error);
        setLyrics([]);
      }
    }

    loadLyrics();
  }, [track?.id]);

  useEffect(() => {
    if (!isPlaying || !track?.durationMs) return;

    const timer = setInterval(() => {
      setProgressMs((prev) => Math.min(prev + 1000, track.durationMs));
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, track?.durationMs]);

  const activeLyricIndex = useMemo(() => {
    return getActiveLyricIndex(lyrics, progressMs);
  }, [lyrics, progressMs]);

  const styleVars = {
    "--g1": colors[0],
    "--g2": colors[1],
    "--g3": colors[2],
    "--g4": colors[3]
  };

  const lyricLineHeight = 150;
  const activeLineTop = 270; //try 270 or 310
  const lyricsTranslateY =
    activeLyricIndex >= 0
      ? `translateY(${activeLineTop - activeLyricIndex * lyricLineHeight}px)`
      : `translateY(${activeLineTop}px)`;

  if (loadingAuth) {
    return (
      <div className="app shell-center" style={styleVars}>
        <div className="mesh-bg" />
        <div className="panel-card">Loading Spotify session...</div>
      </div>
    );
  }

  if (!getAccessToken()) {
    return (
      <div className="app shell-center" style={styleVars}>
        <div className="mesh-bg" />
        <div className="panel-card login-card">
          <p className="eyebrow">Aura</p>
          <h1>Aura</h1>
          <h1>Connect Spotify</h1>
          <p className="subtext">
            An ambient Spotify display with live lyrics.
          </p>
          <button className="primary-btn" onClick={loginWithSpotify}>
            Continue with Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app" style={styleVars}>
      <div className="mesh-bg" />
      <div className="grain" />

      <div className="logout-zone">
        <button className="logout-btn" onClick={logout} aria-label="Log out">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 6h9v9M18 6L6 18"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <main className="layout">
        <section className="left-column">
          <div className="cover-shell glass">
            {track?.image ? (
              <img className="cover-art" src={track.image} alt={track.name} />
            ) : (
              <div className="cover-art cover-placeholder">No track playing</div>
            )}
          </div>

          <div className="track-card glass">
            <div className="track-text">
              <h1>{track?.name || "Nothing playing"}</h1>
              <p>{track?.artist || "Open Spotify on one of your devices"}</p>
            </div>

            <div className="progress-block">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: track?.durationMs
                      ? `${(progressMs / track.durationMs) * 100}%`
                      : "0%"
                  }}
                />
              </div>

              <div className="time-row">
                <span>{formatTime(progressMs)}</span>
                <span>{formatTime(track?.durationMs || 0)}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="lyrics-card">
          <div className="lyrics-viewport">
            {lyrics.length ? (
              <div
                className="lyrics-track"
                style={{ transform: lyricsTranslateY }}
              >
                {lyrics.map((line, index) => {
                  const offset = index - activeLyricIndex;

                  let className = "lyric-line";
                  if (offset === 0) className += " active";
                  else if (offset === 1) className += " next";
                  else if (offset === 2) className += " near";
                  else if (offset < 0) className += " past";
                  else className += " far";

                  return (
                    <p
                      key={`${line.timeMs}-${index}`}
                      className={className}
                    >
                      <span className="lyric-line-inner">{line.text || "♪"}</span>
                    </p>
                  );
                })}
              </div>
            ) : (
              <div className="empty-lyrics">
                <p>No synced lyrics found for this track.</p>
              </div>
            )}
          </div>
        </section> 
      </main>
    </div>
  );
}