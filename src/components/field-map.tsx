"use client"

import dynamic from "next/dynamic"

export const FieldMap = dynamic(
  () => import("@/components/field-map-inner").then((mod) => mod.FieldMapInner),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-[#e7e1d4]" />,
  },
)
