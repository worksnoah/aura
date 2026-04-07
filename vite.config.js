import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const repoName = "ambient-web-music-player";

export default defineConfig({
  base: "/ambient-web-music-player/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        name: "Ambient Web Music Player",
        short_name: "Ambient Player",
        description: "Fullscreen ambient Spotify now-playing display with synced lyrics.",
        theme_color: "#09090d",
        background_color: "#09090d",
        display: "standalone",
        display_override: ["window-controls-overlay"],
        start_url: "/ambient-web-music-player/",
        scope: "/ambient-web-music-player/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});
