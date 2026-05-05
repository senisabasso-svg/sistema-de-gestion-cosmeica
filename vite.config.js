import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["assets/logo.png"],
      manifest: {
        id: "/",
        name: "Gestion Cosmetica",
        short_name: "Gestion Cosmetica",
        description:
          "Software para administrar turnos, cobros, clientes e informes en peluquerias y barberias.",
        theme_color: "#6f4ff2",
        background_color: "#f8f8fb",
        display: "standalone",
        start_url: "/",
        scope: "/",
        lang: "es",
        orientation: "portrait-primary",
        categories: ["business", "productivity"],
        icons: [
          {
            src: "assets/logo.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "assets/logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
