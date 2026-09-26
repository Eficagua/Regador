import type { Metadata, Viewport } from "next"
import { Fraunces, Outfit } from "next/font/google"
import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
})

export const metadata: Metadata = {
  title: "regador",
  description: "Bitácora de riego: lotes, suelo y evapotranspiración de tu campo.",
  applicationName: "regador",
  appleWebApp: { capable: true, title: "regador", statusBarStyle: "default" },
}

export const viewport: Viewport = {
  themeColor: "#163e73",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${outfit.variable} ${fraunces.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
