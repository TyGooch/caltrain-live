const sizeWindow = () => {
  $('#map').height($(window).height() - 120);
};

var map;

const setupMap = () => {
  map = new L.Map('map');
  const layer = new L.TileLayer('https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=ac296621faec49b08c9c67f46e3f614f'
  , {
    attribution: 'Maps &copy; Thunderforest, Data &copy; OpenStreetMap contributors',
    maxZoom: 12
  });
  const center = new L.LatLng(37.4419, -122.1430);
  map.setView(center, 9).addLayer(layer);

  // add markers

  const stopMarker = L.Icon.extend({
    options: {
      iconUrl: 'assets/images/stop.png',
      iconSize: new L.Point(12, 12),
      iconAnchor: new L.Point(6, 6),
      popupAnchor: new L.Point(0, -3)
    }
  });

  const stopIcon = new stopMarker();

  //add stations
  $.each(stops, function(i, stop) {
    var marker = new L.Marker(new L.LatLng(stop.lat, stop.lon), {
      icon: stopIcon,
      zIndexOffset:-10
    });
    map.addLayer(marker);
  });
  };

  

$(document).ready(function() {
  sizeWindow();
  window.onResize = sizeWindow;
  setupMap();
});
