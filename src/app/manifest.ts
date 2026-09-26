import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "regador",
    short_name: "regador",
    description: "Bitácora de riego: lotes, suelo y evapotranspiración.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f0e6",
    theme_color: "#163e73",
    lang: "es",
  }
}
