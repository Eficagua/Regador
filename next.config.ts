import type { NextConfig } from "next"

// El visor de Cursor publica la app en *.agent.cvm.dev y reenvía con
// x-forwarded-host en *.cursorvm.com. Sin esta lista, Next.js aborta
// las acciones de servidor (entrar, guardar riego, cerrar sesión).
const previewOrigins = ["*.agent.cvm.dev", "*.cursorvm.com", "127.0.0.1"]

const nextConfig: NextConfig = {
  allowedDevOrigins: previewOrigins,
  experimental: {
    serverActions: {
      allowedOrigins: previewOrigins,
    },
  },
}

export default nextConfig
