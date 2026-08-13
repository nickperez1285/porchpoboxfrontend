import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const toRad = (deg) => (deg * Math.PI) / 180;

const distanceMiles = (a, b) => {
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

const formatDistance = (mi) => {
  if (mi < 0.1) return `${Math.round(mi * 5280)} ft away`;
  if (mi < 10) return `${mi.toFixed(1)} mi away`;
  return `${Math.round(mi)} mi away`;
};

const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

const markerAriaLabel = (vendor) => {
  const address = [vendor.streetAddress, vendor.city, vendor.state]
    .filter(Boolean)
    .join(", ");
  return `Porch P.O. Box - ${vendor.businessName || "Partner location"}${
    address ? `, ${address}` : ""
  }`;
};

const MapA11y = ({ mapRef }) => {
  const map = useMap();
  useEffect(() => {
    if (mapRef) mapRef.current = map;
    if (!map || typeof map.getContainer !== "function") return;
    const container = map.getContainer();
    const zoomIn = container.querySelector(".leaflet-control-zoom-in");
    const zoomOut = container.querySelector(".leaflet-control-zoom-out");
    if (zoomIn) {
      zoomIn.setAttribute("aria-label", "Zoom in on map");
      zoomIn.setAttribute("title", "Zoom in");
    }
    if (zoomOut) {
      zoomOut.setAttribute("aria-label", "Zoom out on map");
      zoomOut.setAttribute("title", "Zoom out");
    }
  }, [map, mapRef]);
  return null;
};

const PartnerMap = ({
  mapCenter,
  zoom,
  userCoords,
  markersWithDistance,
  mapRef,
  focusedMarkerId,
  onMarkerFocus,
  onMarkerBlur,
  isPreferred,
}) => {
  return (
    <div className="mp-map-canvas">
      <span className="visually-hidden">
        This map shows all partner locations. Use the buttons to zoom in and out
        in the top left corner, and pan with the arrow keys when the map is
        focused. For full keyboard access, use the "All partner locations" list.
      </span>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ width: "100%", height: "100%" }}
      >
        <MapRecenter center={mapCenter} />
        <MapA11y mapRef={mapRef} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {userCoords && (
          <Circle
            center={[userCoords.lat, userCoords.lng]}
            radius={600}
            pathOptions={{ color: "#1557d6", fillColor: "#1557d6", fillOpacity: 0.15 }}
          >
            <Popup>Your address</Popup>
          </Circle>
        )}
        {markersWithDistance.map(({ vendor, lat, lng, distance }) => (
          <Marker
            key={vendor.id}
            position={[lat, lng]}
            alt={markerAriaLabel(vendor)}
            eventHandlers={{
              focus: () => onMarkerFocus(vendor.id),
              blur: () => onMarkerBlur(vendor.id),
            }}
          >
            <Popup>
              <strong>{vendor.businessName}</strong>
              <br />
              {[vendor.streetAddress, vendor.city, vendor.state]
                .filter(Boolean)
                .join(", ")}
              {userCoords && Number.isFinite(distance) && (
                <>
                  <br />
                  {formatDistance(distance)}
                </>
              )}
              <br />
              {vendor.storeHours || vendor.store_hours || ""}
              {isPreferred(vendor.id) && (
                <>
                  <br />
                  <span aria-hidden="true">✓</span> Your preferred location
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default PartnerMap;
