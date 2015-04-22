// Defines function to convert to degrees to radians
if (typeof(Number.prototype.toRad) === "undefined") {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  };
}

// Calculates the distance between 2 waypoints
// Takes in latitudes and longitudes
// Returns distance in miles
module.exports.calcDistance = function(pt1, pt2) {
  var R = 6371; // Earth's radius, in km
  var lat1 = pt1.location.coordinate.latitude;
  var lon1 = pt1.location.coordinate.longitude;
  var lat2 = pt2.location.coordinate.latitude;
  var lon2 = pt2.location.coordinate.longitude;

  // Calculates the change in location
  var dLat = (lat2 - lat1).toRad();
  var dLon = (lon2 - lon1).toRad();

  // Converts location to radians
  lat1 = lat1.toRad();
  lat2 = lat2.toRad();


  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);


  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var distance = R * c * 0.621371; // convert distance from km to miles
  return distance;
};

// Parses Google coordinate into {latitude:..., longitude: ... } format
module.exports.parseGoogleCoord = function(googleCoord) {
  var latitude  = parseFloat(googleCoord.match(/^.*,/)[0].replace(",", ""));
  var longitude = parseFloat(googleCoord.match(/,.*$/)[0].replace(",", ""));
  return {
    location: {
      coordinate : {
        latitude: latitude,
        longitude: longitude
      }
    }
  };
};

// Trims the Google waypoint coordinate to remove start and end
// Discourages clustering at the 2 ends of the trip
module.exports.trimGoogleCoord = function(googleCoords, distance) {
  var trimmedCoords = [];

  // Pushes the coordinates that are a reasonable distance from the starting and ending locations
  if (googleCoords.length > 5) {
    // console.log('even is', distance/20);
    for (var i = 0; i < googleCoords.length; i++) {
      // if (i>0)
      // console.log(i, 'Dist:', exports.calcDistance(exports.parseGoogleCoord(googleCoords[i]), exports.parseGoogleCoord(googleCoords[i-1])));

      var distanceToStart = module.exports.calcDistance(module.exports.parseGoogleCoord(googleCoords[i]), module.exports.parseGoogleCoord(googleCoords[0]));
      var distanceToEnd = module.exports.calcDistance(module.exports.parseGoogleCoord(googleCoords[i]), module.exports.parseGoogleCoord(googleCoords[googleCoords.length - 1]));

      if (distanceToStart >= distance / 20 && distanceToEnd >= distance / 20) {
        trimmedCoords.push(googleCoords[i]);
      }
    }
  } else {
    trimmedCoords = googleCoords;
  }
  return trimmedCoords;
};
