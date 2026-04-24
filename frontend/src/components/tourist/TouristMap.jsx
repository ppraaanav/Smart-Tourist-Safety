import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
};

function MapComponent() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
  }, []);

  return (
    // <LoadScript googleMapsApiKey="AIzaSyBahdSYiv_xjChAwfQTqCEfetuwFMEGJwU">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={location || { lat: 28.6139, lng: 77.2090 }}
        zoom={12}
      >
        {location && <Marker position={location} />}
      </GoogleMap>
    // </LoadScript>
  );
}

export default MapComponent;