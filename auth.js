const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

const SCOPES = [
  "user-read-currently-playing",
  "user-read-playback-state"
];

const STORAGE_KEYS = {
  verifier: "spotify_pkce_verifier",
  accessToken: "spotify_access_token",
  refreshToken: "spotify_refresh_token",
  expiresAt: "spotify_token_expires_at"
};

function randomString(length = 128) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  let result = "";

  for (let i = 0; i < randomValues.length; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
}

async function sha256(plainText) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  return window.crypto.subtle.digest("SHA-256", data);
}

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generateCodeChallenge(verifier) {
  const hashed = await sha256(verifier);
  return base64UrlEncode(hashed);
}

export async function loginWithSpotify() {
  if (!CLIENT_ID || !REDIRECT_URI) {
    throw new Error("Missing Spotify environment variables.");
  }

  const verifier = randomString(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem(STORAGE_KEYS.verifier, verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: challenge,
    scope: SCOPES.join(" ")
  });

  window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
}

export async function exchangeCodeForToken(code) {
  const verifier = localStorage.getItem(STORAGE_KEYS.verifier);

  if (!verifier) {
    throw new Error("Missing code verifier.");
  }

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${text}`);
  }

  const data = await response.json();
  storeTokens(data);
  localStorage.removeItem(STORAGE_KEYS.verifier);
  return data;
}

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);

  if (!refreshToken) {
    throw new Error("No refresh token available.");
  }

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refreshToken
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Refresh failed: ${text}`);
  }

  const data = await response.json();
  storeTokens(data, true);
  return data;
}

function storeTokens(data, isRefresh = false) {
  if (data.access_token) {
    localStorage.setItem(STORAGE_KEYS.accessToken, data.access_token);
  }

  if (data.refresh_token) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, data.refresh_token);
  }

  const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  localStorage.setItem(STORAGE_KEYS.expiresAt, String(expiresAt));

  if (!isRefresh) {
    localStorage.removeItem(STORAGE_KEYS.verifier);
  }
}

export function getAccessToken() {
  return localStorage.getItem(STORAGE_KEYS.accessToken);
}

export function isTokenExpired() {
  const expiresAt = Number(localStorage.getItem(STORAGE_KEYS.expiresAt) || 0);
  return !expiresAt || Date.now() > expiresAt - 60000;
}

export async function ensureValidAccessToken() {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  if (isTokenExpired()) {
    await refreshAccessToken();
  }

  return getAccessToken();
}

export function logout() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

export function getCodeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("code");
}

export function clearCodeFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  window.history.replaceState({}, document.title, url.pathname + url.hash);
}
