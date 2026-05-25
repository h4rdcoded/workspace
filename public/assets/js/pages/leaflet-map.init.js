var mymap = L.map("leaflet-map").setView([51.505, -0.09], 13);

L.tileLayer(
  "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=YOUR_MAPBOX_TOKEN",
  {
    maxZoom: 18,
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: "mapbox/streets-v11",
    tileSize: 512,
    zoomOffset: -1,
  }
).addTo(mymap);

// Marker Map
var markermap = L.map("leaflet-map-marker").setView([51.505, -0.09], 13);

L.tileLayer(
  "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=YOUR_MAPBOX_TOKEN",
  {
    maxZoom: 18,
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: "mapbox/streets-v11",
    tileSize: 512,
    zoomOffset: -1,
  }
).addTo(markermap);

L.marker([51.5, -0.09]).addTo(markermap);

L.circle([51.508, -0.11], {
  color: "#0ab39c",
  fillColor: "#0ab39c",
  fillOpacity: 0.5,
  radius: 500,
}).addTo(markermap);

L.polygon(
  [
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047],
  ],
  {
    color: "#405189",
    fillColor: "#405189",
  }
).addTo(markermap);

// Popup Map
var popupmap = L.map("leaflet-map-popup").setView([51.505, -0.09], 13);

L.tileLayer(
  "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=YOUR_MAPBOX_TOKEN",
  {
    maxZoom: 18,
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: "mapbox/streets-v11",
    tileSize: 512,
    zoomOffset: -1,
  }
).addTo(popupmap);

L.marker([51.5, -0.09])
  .addTo(popupmap)
  .bindPopup("<b>Hello world!</b><br />I am a popup.")
  .openPopup();

L.circle([51.508, -0.11], {
  color: "#f06548",
  fillColor: "#f06548",
  fillOpacity: 0.5,
  radius: 500,
})
  .addTo(popupmap)
  .bindPopup("I am a circle.");

L.polygon(
  [
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047],
  ],
  {
    color: "#405189",
    fillColor: "#405189",
  }
)
  .addTo(popupmap)
  .bindPopup("I am a polygon.");

// Custom Icons
var customiconsmap = L.map("leaflet-map-custom-icons").setView(
  [51.5, -0.09],
  13
);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(customiconsmap);

var LeafIcon = L.Icon.extend({
  options: {
    iconSize: [45, 45],
    iconAnchor: [22, 94],
    popupAnchor: [-3, -76],
  },
});

var greenIcon = new LeafIcon({
  iconUrl: "assets/images/logo-sm.png",
});

L.marker([51.5, -0.09], { icon: greenIcon }).addTo(customiconsmap);

// Interactive Map
var interactivemap = L.map("leaflet-map-interactive-map").setView(
  [37.8, -96],
  4
);

function getColor(d) {
  return d > 1000
    ? "#405189"
    : d > 500
    ? "#516194"
    : d > 200
    ? "#63719E"
    : d > 100
    ? "#7480A9"
    : d > 50
    ? "#8590B4"
    : d > 20
    ? "#97A0BF"
    : "#A8B0C9";
}

function style(feature) {
  return {
    weight: 2,
    opacity: 1,
    color: "white",
    dashArray: "3",
    fillOpacity: 0.7,
    fillColor: getColor(feature.properties.density),
  };
}

L.tileLayer(
  "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=YOUR_MAPBOX_TOKEN",
  {
    maxZoom: 18,
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: "mapbox/light-v9",
    tileSize: 512,
    zoomOffset: -1,
  }
).addTo(interactivemap);

var geojson = L.geoJson(statesData, {
  style: style,
}).addTo(interactivemap);

// Layer Groups
var cities = L.layerGroup();

L.marker([39.61, -105.02])
  .bindPopup("This is Littleton, CO.")
  .addTo(cities);

L.marker([39.74, -104.99])
  .bindPopup("This is Denver, CO.")
  .addTo(cities);

L.marker([39.73, -104.8])
  .bindPopup("This is Aurora, CO.")
  .addTo(cities);

L.marker([39.77, -105.23])
  .bindPopup("This is Golden, CO.")
  .addTo(cities);

var mbAttr =
  'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
  '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
  'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';

var mbUrl =
  "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=YOUR_MAPBOX_TOKEN";

var grayscale = L.tileLayer(mbUrl, {
  id: "mapbox/light-v9",
  tileSize: 512,
  zoomOffset: -1,
  attribution: mbAttr,
});

var streets = L.tileLayer(mbUrl, {
  id: "mapbox/streets-v11",
  tileSize: 512,
  zoomOffset: -1,
  attribution: mbAttr,
});

var layergroupcontrolmap = L.map("leaflet-map-group-control", {
  center: [39.73, -104.99],
  zoom: 10,
  layers: [streets, cities],
});

var baseLayers = {
  Grayscale: grayscale,
  Streets: streets,
};

var overlays = {
  Cities: cities,
};

L.control.layers(baseLayers, overlays).addTo(layergroupcontrolmap);