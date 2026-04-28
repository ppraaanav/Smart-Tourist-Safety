import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { useEffect, useRef } from "react";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const center = {
  lat: 28.6139, // default (Delhi)
  lng: 77.2090,
};

// 🔴 severity based colors
const getMarkerIcon = (severity) => {
  switch (severity) {
    case "critical":
      return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
    case "high":
      return "http://maps.google.com/mapfiles/ms/icons/orange-dot.png";
    case "medium":
      return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
    default:
      return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
  }
};

const AdvancedMap = ({ incidents = [] }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyBahdSYiv_xjChAwfQTqCEfetuwFMEGJwU",
  });

  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    // remove old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const newMarkers = incidents.map((incident) => {
      const [lng, lat] = incident.location.coordinates;

      return new window.google.maps.Marker({
        position: { lat, lng },
        icon: getMarkerIcon(incident.severity),
      });
    });

    markersRef.current = newMarkers;

    // clustering
    new MarkerClusterer({
      markers: newMarkers,
      map: mapRef.current,
    });
  }, [incidents]);

  if (!isLoaded) return <p>Loading map...</p>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={6}
      onLoad={(map) => (mapRef.current = map)}
    />
  );
};

export default AdvancedMap;
