var map;
var activeTrains = [];

const sizeWindow = () => {
  $('#map').height($(window).height() - 120);
};

const setupMap = () => {
  map = new L.Map('map');
  const layer = new L.TileLayer('https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=ac296621faec49b08c9c67f46e3f614f'
  , {
    attribution: 'Maps &copy; Thunderforest, Data &copy; OpenStreetMap contributors',
    maxZoom: 12
  });
  // var track = new L.KML("track.kml", {async: true});
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

  //add stops
  $.each(stops, (i, stop) => {
    var marker = new L.Marker(new L.LatLng(stop.lat, stop.lon), {
      icon: stopIcon,
      zIndexOffset:-10
    });
    map.addLayer(marker);
  });
};

//add trains
const getActiveTrains = () => {
  activeTrains = [];
  $.each(trains, (i, train) => {
    const time = '5:00';
    const firstStop = train.stops[0];
    const lastStop = train.stops[train.stops.length-1];
    const now = new Date(2016, 9, 21, 13, 30);
    const start = getTime(firstStop);
    const stop = getTime(lastStop);

    if(start <= now && now <= stop){
      activeTrains.push(train);
    }
  });
};

const getTime = (stop) => {
  const time = new Date(2016, 9, 21);
  time.setHours(parseInt(stop[0].substr(0,2)));
  time.setMinutes(parseInt(stop[0].substr(3,4)));
  return time;
};

const getPos = (train) => {
  const now = new Date(2016, 9, 21, 13, 30);
  let prevStop, nextStop;
  train.stops.forEach((stop, idx, stopArr) => {
    if(getTime(stop) <= now && now <= getTime(stopArr[idx + 1])){
      prevStop = stop;
      nextStop = stopArr[idx + 1];
    }
  });

  let timeDif = (now - getTime(prevStop));
  let expectedTime = (getTime(nextStop) - getTime(prevStop));
  let percentage = timeDif / expectedTime;

  let prevLat, prevLon, nextLat, nextLon;

  $.each(stops, (i, stop) => {
    if(stop.acronym === prevStop[1]){
      prevLat = stop.lat;
      prevLon = stop.lon;
    } else if(stop.acronym === nextStop[1]){
      nextLat = stop.lat;
      nextLon = stop.lon;
    }
  });

  let dLat = percentage * (nextLat - prevLat);
  let dLon = percentage * (nextLon - prevLon);

  // new lat
  let lat;
  if(train.direction === 'north'){
    lat = prevLat + dLat;
  } else{
    lat = prevLat - dLat;
  }

  // new lon
  let lon;
  if(nextLat > prevLat){
    lon = prevLon + dLon;
  } else{
    lon = prevLon + dLon;
  }

  // console.log(`${lat} ${lon}`);
  return([lat, lon]);
};

const mapTrains = () => {
  // const now = new Date(2016, 9, 21, 5, 50);
  getActiveTrains();

  const trainMarker = L.Icon.extend({
    options: {
      iconUrl: 'assets/images/train.png',
      iconSize: new L.Point(30, 30),
      iconAnchor: new L.Point(15, 15),
      popupAnchor: new L.Point(0, -3)
    }
  });

  const trainIcon = new trainMarker();

  activeTrains.forEach((train) => {
    let pos = getPos(train);



    var marker = new L.Marker(new L.LatLng(pos[0], pos[1]), {
      icon: trainIcon,
      zIndexOffset:-10
    });
    map.addLayer(marker);
  });
};

// const getPos = (prev, next, currentTime, delay) => {
//   const prevStop = stops[prev[1]];
//   const nextStop = stops[next[1]];
//
//   return null;
//
// };



$(document).ready(function() {
  sizeWindow();
  window.onResize = sizeWindow;
  setupMap();
  getActiveTrains();
  mapTrains();
});
