import { GoogleMap, Marker, Circle, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("https://smart-tourist-safety-piu5.onrender.com", {
  transports: ["websocket"],
});

const containerStyle = {
  width: "100%",
  height: "400px",
};

const GEOFENCE = {
  center: { lat: 28.6139, lng: 77.2090 },
  radius: 50000,
};

const HeatmapView = ({ data = [] }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyBahdSYiv_xjChAwfQTqCEfetuwFMEGJwU",
  });
  const [liveData, setLiveData] = useState([]);

  useEffect(() => {
    socket.on("locationUpdate", (newData) => {
      setLiveData(newData);
    });

    return () => socket.off("locationUpdate");
  }, []);

  useEffect(() => {
    if (data.length) setLiveData(data);
  }, [data]);

  const isInside = (p) => {
    const dx = p.lat - GEOFENCE.center.lat;
    const dy = p.lng - GEOFENCE.center.lng;
    return Math.sqrt(dx * dx + dy * dy) * 111000 < GEOFENCE.radius;
  };

  if (loadError) {
    return <div className="glass-card-solid p-4">Map failed to load.</div>;
  }

  if (!isLoaded) {
    return <div className="glass-card-solid p-4">Loading map...</div>;
  }

  return (
    <div className="glass-card-solid overflow-hidden">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={GEOFENCE.center}
        zoom={5}
      >
        <Circle
          center={GEOFENCE.center}
          radius={GEOFENCE.radius}
          options={{
            fillColor: "blue",
            fillOpacity: 0.1,
            strokeColor: "blue",
          }}
        />

        {liveData.map((p, i) => (
          <Marker
            key={i}
            position={{ lat: p.lat, lng: p.lng }}
            icon={{
              url: isInside(p)
                ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                : "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
            }}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export default HeatmapView;
