import React, { useEffect, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
};

function MapComponent() {
  const [location, setLocation] = useState(null);
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyBahdSYiv_xjChAwfQTqCEfetuwFMEGJwU",
  });

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  if (loadError) {
    return <div className="glass-card-solid p-4">Map failed to load. Check your Google Maps API key and network connection.</div>;
  }

  if (!isLoaded) {
    return <div className="glass-card-solid p-4">Loading map...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={location || { lat: 28.6139, lng: 77.2090 }}
      zoom={12}
    >
      {location && <Marker position={location} />}
    </GoogleMap>
  );
}

export default MapComponent;
