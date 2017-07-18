var map;
var activeTrains = [];

function sizeWindow() {
  $('#map').height($(window).height() - 50);
  $('#map').width($(window).width() - 250);
}

function setupMap() {
  // initialize map
  map = new L.Map('map');
  const layer = new L.TileLayer('http://mt1.google.com/vt/lyrs=m@121,transit|vm:1&hl=en&opts=r&x={x}&y={y}&z={z}'
  , {
    attribution: 'Maps &copy; Google',
    maxZoom: 14
  });
  const center = new L.LatLng(37.5, -122.1430);
  map.setView(center, 10).addLayer(layer);

  // add track
  const trackCoords = [];
  $.each(track, (i, coord) => {
    trackCoords.push(coord);
  });
  var polyline = L.polyline(trackCoords, {color: 'red'}).addTo(map);


  // add markers
  addStopMarkers();
}

function addStopMarkers() {
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
    let marker = new L.Marker(new L.LatLng(stop.lat, stop.lon), {
      icon: stopIcon,
      zIndexOffset:-10
    });

    // add stop info popup
    let nextTrains = getNextTrain(stop);
    let markerText;
    if(nextTrains.length > 0){
      markerText = getStopMarkerText(stop);
    } else{
      markerText = `<b>${stop.name}</b><br>No trains scheduled.`;
    }
    marker.bindPopup(markerText);
    map.addLayer(marker);
  });
}

function getStopMarkerText(stop) {
  let nextTrains = getNextTrain(stop);
  // sort nextTrains by time
  nextTrains = sortNextTrains(nextTrains);

  let nextTrainText = [];
  for(let i = 0; (i <= 3 && i <= nextTrains.length - 1); i++){
    let train = nextTrains[i][0];
    nextTrainText.push(`${train.number} (${train.direction}bound ${train.type}) in ${nextTrains[i][1]} minutes.<br>`);
  }

  let markerText = `<b>${stop.name}</b><br>Next Trains: <br>`;
  nextTrainText.forEach((text, idx) => {
    if(idx < 3){
      markerText += text;
    }
  });
  return markerText;
}

function sortNextTrains(nextTrains) {
  for(let j = 0; j < nextTrains.length ; j++){
    nextTrains.forEach((train, i, arr) => {
      if(i < arr.length - 1){
        if(arr[i][1] > arr[i+1][1]){
          let tmp = arr[i+1];
          arr[i+1] = arr[i];
          arr[i] = tmp;
        }
      }
    });
  }
  return nextTrains;
}

//add trains
function getActiveTrains() {
  activeTrains = [];
  $.each(trains, (i, train) => {
    const firstStop = train.stops[0];
    const lastStop = train.stops[train.stops.length-1];
    const now = Date.now();
    const start = getTime(firstStop);
    const stop = getTime(lastStop);

    // check if active train
    if(start <= now && now <= stop){
      activeTrains.push(train);
    }
  });
}

function getTime(stop) {
  const time = new Date();
  time.setHours(parseInt(stop[0].substr(0,2)));
  time.setMinutes(parseInt(stop[0].substr(3,4)));

  // adjust for trains after midnight
  if(stop[0].substr(0,2) < 3){
    time.setDate(time.getDate() + 1);
  }

  return Date.parse(time);
}

function getPos(train) {
  const now = Date.now();

  // find previous and next stop
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

  // get stop coords
  $.each(stops, (i, stop) => {
    if(stop.acronym === prevStop[1]){
      prevLat = stop.lat;
      prevLon = stop.lon;
    } else if(stop.acronym === nextStop[1]){
      nextLat = stop.lat;
      nextLon = stop.lon;
    }
  });

  // find estimated distance traveled
  let dLat = percentage * (nextLat - prevLat);
  let dLon = percentage * (nextLon - prevLon);

  // new lat
  let lat = prevLat + dLat;
  let lon = prevLon + dLon;

  // find closest track coordinate to estimated distance traveled
  let closestCoord;
  let minDistance = 10000000;
  $.each(track, (i, coord) => {
    let distance = Math.sqrt(Math.pow((lat - coord[0]), 2) + Math.pow((lon - coord[1]), 2));
    if(distance < minDistance){
      closestCoord = coord;
      minDistance = distance;
    }
  });

  return(closestCoord);
}

function getNextStop(train) {
  const now = Date.now();
  let nextStop;
  train.stops.forEach((stop, idx, stopArr) => {
    if(getTime(stop) <= now && now <= getTime(stopArr[idx + 1])){
      nextStop = stopArr[idx + 1];
    }
  });

  return nextStop;
}

function getHeading(train, trainCoord) {
  // check for edge cases
  // if(trainCoord ===   [37.77641362, -122.39509821] || [37.00443764, -121.56668186]){
  //   console.log(trainCoord);
  //   return 0;
  // };

  // get track coords
  const trackCoords = [];
  $.each(track, (i, coord) => {
    trackCoords.push(coord);
  });

  let nextCoordTmp;
  let currentCoord = new google.maps.LatLng(trainCoord[0], trainCoord[1]);

  if(train.direction === 'north'){
    // adjust for edge case
    if(trainCoord === [37.77641362, -122.39509821]){
      nextCoordTmp = trainCoord;
    }
    else{
      nextCoordTmp = trackCoords[trackCoords.indexOf(trainCoord) - 1];
    }
  }
  else {
    // adjust for edge case
    if(trainCoord === [37.00443764, -121.56668186]){
      nextCoordTmp = trainCoord;
    }
    else{
      nextCoordTmp = trackCoords[trackCoords.indexOf(trainCoord) + 1];
    }
  }

  let nextCoord = new google.maps.LatLng(nextCoordTmp[0], nextCoordTmp[1]);
  let heading = google.maps.geometry.spherical.computeHeading(currentCoord, nextCoord);
  return heading;
}

function mapTrains() {
  getActiveTrains();

  // add markers
  activeTrains.forEach((train) => {
    const trainMarker = L.Icon.extend({
      options: {
        iconUrl: `assets/images/${train.type}.png`,
        iconSize: new L.Point(30, 30),
        iconAnchor: new L.Point(15, 15),
        popupAnchor: new L.Point(0, 0)
      }
    });
    const trainIcon = new trainMarker();
    let pos = getPos(train);

    // get heading
    let heading = getHeading(train, pos);

    let marker = new L.rotatedMarker(new L.LatLng(pos[0], pos[1]), {
      icon: trainIcon,
      angle: heading,
      zIndexOffset:-10
    });

    let nextStop = getNextStop(train);
    // get stop name
    let nextStopName;
    $.each(stops, (i, stop) => {
      if(nextStop[1] === stop.acronym){
        nextStopName = stop.name;
      }
    });
    // get stop time
    let nextStopTime = Math.floor(((getTime(nextStop) - Date.now()) / 1000) / 60);
    // add capitalization
    String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
    }
    // set marker text
    let markerText = '<b>' + train.number + ' - ' + train.direction.capitalize() +
    'bound ' + train.type.capitalize() + '</b><br>' +
    'Next Stop: ' + nextStopName + ' in ' + nextStopTime + ' minutes';

    marker.bindPopup(markerText);
    map.addLayer(marker);
    train.marker = marker;
  });
}

function removeTrains() {
  activeTrains.forEach(train => {
    map.removeLayer(train.marker);
  });
}

function getNextTrain(stop) {
  let now = Date.now();
  let result = [];
  $.each(trains, (i, train) => {
    train.stops.forEach(trainStop => {
      if(trainStop[1] === stop.acronym && getTime(trainStop) >= now) {
        result.push([train, Math.floor(((getTime(trainStop) - now)/1000)/60)]);
      }
    });
  });
  return result;
}

$(document).ready(() => {
  sizeWindow();
  window.onResize = sizeWindow;
  setupMap();
  getActiveTrains();
  mapTrains();
  window.setInterval(() =>
  {
    removeTrains();
    addStopMarkers();
    getActiveTrains();
    mapTrains();
  }, 15000);
});
