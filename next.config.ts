import type { NextConfig } from "next";

// Percorso base per il sotto-sito di GitHub Pages (es. "/teamup-scheduler").
// Vuoto in sviluppo e per le pagine utente/organizzazione (<utente>.github.io).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "";

const nextConfig: NextConfig = {
  // Export statico: l'app è interamente client-side (localStorage), così può
  // essere ospitata su GitHub Pages.
  output: "export",
  basePath: basePath || undefined,
  // Genera /percorso/index.html, che GitHub Pages serve in modo affidabile.
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // L'ottimizzazione di next/image non è disponibile con l'export statico.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
