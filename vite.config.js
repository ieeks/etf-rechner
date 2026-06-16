import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" => relative Asset-Pfade. Funktioniert auf GitHub Pages unabhängig
// vom Repo-Namen (https://<user>.github.io/<repo>/). Für einen festen Pfad
// stattdessen z. B. base: "/sparplan-rechner/" setzen.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
