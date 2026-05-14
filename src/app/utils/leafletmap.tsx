import React, { useRef, useEffect, useCallback } from "react";

// 1. Define Types
export interface Coords {
  lat: number;
  lng: number;
}

// 2. Define Constants (Update these with your specific location data)
const START_COORDS: Coords = { lat: 1.3521, lng: 103.8198 }; // Example: Singapore
const START_LABEL = "Starting Point";

interface LeafletMapProps {
  onSelect: (c: Coords) => void;
  selected: Coords | null;
  flyTo: Coords | null;
}

// ── Leaflet map ───────────────────────────────────────────────────────────────
const LeafletMap = ({ onSelect, selected, flyTo }: LeafletMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);
  const destMarker = useRef<any>(null);
  const routeLine = useRef<any>(null);

  const placeDestMarker = useCallback((L: any, map: any, lat: number, lng: number) => {
    const destIcon = L.divIcon({
      className: "",
      html: `<div style="width:14px;height:14px;border-radius:50%;background:#60a5fa;
              border:3px solid #fff;box-shadow:0 0 0 2px #60a5fa;"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    
    if (destMarker.current) map.removeLayer(destMarker.current);
    if (routeLine.current) map.removeLayer(routeLine.current);

    destMarker.current = L.marker([lat, lng], { icon: destIcon })
      .addTo(map)
      .bindPopup(
        `<b style="color:#60a5fa">📍 Meeting point</b><br/>${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        { closeButton: false }
      )
      .openPopup();

    routeLine.current = L.polyline(
      [[START_COORDS.lat, START_COORDS.lng], [lat, lng]],
      { color: "#f97316", weight: 2, dashArray: "6 6", opacity: 0.65 }
    ).addTo(map);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || mapInst.current) return;

    // Load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet Script
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = (window as any).L;
      if (!mapRef.current || mapInst.current) return;

      const map = L.map(mapRef.current, { zoomControl: true })
        .setView([START_COORDS.lat, START_COORDS.lng], 13);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap © CARTO", subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      const startIcon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#f97316;
                border:3px solid #fff;box-shadow:0 0 0 2px #f97316;"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      L.marker([START_COORDS.lat, START_COORDS.lng], { icon: startIcon })
        .addTo(map)
        .bindPopup(`<b style="color:#f97316">📍 ${START_LABEL}</b>`, { closeButton: false });

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        placeDestMarker(L, map, lat, lng);
        onSelect({ lat, lng });
      });

      mapInst.current = map;
    };
    document.head.appendChild(script);
  }, [onSelect, placeDestMarker]);

  useEffect(() => {
    if (!flyTo || !mapInst.current) return;
    const L = (window as any).L;
    if (!L) return;
    mapInst.current.flyTo([flyTo.lat, flyTo.lng], 15, { duration: 1.2 });
    placeDestMarker(L, mapInst.current, flyTo.lat, flyTo.lng);
  }, [flyTo, placeDestMarker]);

  useEffect(() => {
    if (!selected && mapInst.current) {
      if (destMarker.current) { mapInst.current.removeLayer(destMarker.current); destMarker.current = null; }
      if (routeLine.current) { mapInst.current.removeLayer(routeLine.current); routeLine.current = null; }
    }
  }, [selected]);

  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(249,115,22,0.3)" }}>
      <div ref={mapRef} style={{ height: 240, width: "100%" }} />
      {!selected && (
        <div style={{
          position: "absolute", bottom: 10, left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.75)", color: "#fff",
          fontSize: 11, fontFamily: "Nunito",
          padding: "5px 14px", borderRadius: 20,
          pointerEvents: "none", letterSpacing: "0.06em",
          whiteSpace: "nowrap",
          zIndex: 1000 // Added to ensure visibility over map tiles
        }}>
          🔍 Search above or click map to set destination
        </div>
      )}
    </div>
  );
};

export default LeafletMap;