"use client"

import { useEffect, useRef } from "react"
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const pin = L.divIcon({
  className: "lamina-pin",
  html: "<span></span>",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

export function FieldMapInner({
  lat,
  lng,
  onChange,
  flyToken = 0,
  readOnly = false,
}: {
  lat: number
  lng: number
  onChange?: (lat: number, lng: number) => void
  flyToken?: number
  readOnly?: boolean
}) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={12}
      className="h-full w-full"
      scrollWheelZoom
      zoomControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyTo lat={lat} lng={lng} token={flyToken} />
      {readOnly ? null : <MapClick onChange={onChange} />}
      <Marker
        position={[lat, lng]}
        icon={pin}
        draggable={!readOnly}
        eventHandlers={
          readOnly
            ? undefined
            : {
                dragend: (event) => {
                  const pos = event.target.getLatLng()
                  onChange?.(pos.lat, pos.lng)
                },
              }
        }
      />
    </MapContainer>
  )
}

function MapClick({ onChange }: { onChange?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onChange?.(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function FlyTo({ lat, lng, token }: { lat: number; lng: number; token: number }) {
  const map = useMap()
  const ultimo = useRef(0)
  useEffect(() => {
    if (token === ultimo.current) return
    ultimo.current = token
    if (token === 0) return
    map.flyTo([lat, lng], Math.max(map.getZoom(), 13))
  }, [token, lat, lng, map])
  return null
}
