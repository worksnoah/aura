import { ensureValidAccessToken, logout } from "./auth";

const API_BASE = "https://api.spotify.com/v1";

async function spotifyFetch(path) {
  const token = await ensureValidAccessToken();

  if (!token) {
    throw new Error("No Spotify token found.");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 204) {
    return null;
  }

  if (response.status === 401) {
    logout();
    throw new Error("Spotify authorization expired.");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify API error: ${text}`);
  }

  return response.json();
}

export async function getCurrentlyPlaying() {
  return spotifyFetch("/me/player/currently-playing");
}
