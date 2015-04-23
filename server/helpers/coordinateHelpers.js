module.exports.radiusFilter = function(distance) {
  return Math.min(Math.max(distance/25, 2), 25);
};

// Defines function to convert to degrees to radians
if (typeof(Number.prototype.toRad) === "undefined") {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  };
}
if (typeof(Number.prototype.toDeg) === "undefined") {
  Number.prototype.toDeg = function() {
    return this * 180 / Math.PI;
  };
}

var R = 3956.5467; // Earth's radius, in mi

// Calculates the distance between 2 waypoints
// Takes in latitudes and longitudes
// Returns distance in miles
module.exports.calcDistance = function(pt1, pt2) {
  // Converts degrees to radians
  var lat1 = pt1.location.coordinate.latitude.toRad();
  var lon1 = pt1.location.coordinate.longitude.toRad();
  var lat2 = pt2.location.coordinate.latitude.toRad();
  var lon2 = pt2.location.coordinate.longitude.toRad();

  // Calculates the change in location
  var dLat = lat2 - lat1;
  var dLon = lon2 - lon1;

  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var distance = R * c;
  return distance;
};

module.exports.calcMidpoints = function(pt1, pt2, totalDistance) {
  var results = [];
  var currentDistanceFilterRatio = Math.floor(module.exports.calcDistance(pt1, pt2) / module.exports.radiusFilter(totalDistance));

  // Converts degrees to radians
  var lat1 = pt1.location.coordinate.latitude.toRad();
  var lon1 = pt1.location.coordinate.longitude.toRad();
  var lat2 = pt2.location.coordinate.latitude.toRad();
  var lon2 = pt2.location.coordinate.longitude.toRad();

  var coords1 = {
    x: Math.cos(lat1)*Math.cos(lon1),
    y: Math.cos(lat1)*Math.sin(lon1),
    z: Math.sin(lat1)
  };
  var coords2 = {
    x: Math.cos(lat2)*Math.cos(lon2),
    y: Math.cos(lat2)*Math.sin(lon2),
    z: Math.sin(lat2)
  };

  for (var i=1; i<currentDistanceFilterRatio; i++) {
    var weight = i/currentDistanceFilterRatio;
    var coordsCombined = {
      x: coords1.x*weight + coords2.x*(1-weight),
      y: coords1.y*weight + coords2.y*(1-weight),
      z: coords1.z*weight + coords2.z*(1-weight)
    };
    var lon = Math.atan2(coordsCombined.y, coordsCombined.x);
    var hyp = Math.sqrt(coordsCombined.x*coordsCombined.x + coordsCombined.y*coordsCombined.y);
    var lat = Math.atan2(coordsCombined.z, hyp);
    results.push(lat.toDeg()+','+lon.toDeg());
  }
  return results;
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
  for (var i = 0; i < googleCoords.length; i++) {
    var distanceToStart = module.exports.calcDistance(module.exports.parseGoogleCoord(googleCoords[i]), module.exports.parseGoogleCoord(googleCoords[0]));
    var distanceToEnd = module.exports.calcDistance(module.exports.parseGoogleCoord(googleCoords[i]), module.exports.parseGoogleCoord(googleCoords[googleCoords.length - 1]));

    if (googleCoords.length <= 5 || (distanceToStart >= distance / 20 && distanceToEnd >= distance / 20)) {
      if (i) {
        trimmedCoords = trimmedCoords.concat(
          module.exports.calcMidpoints(
            module.exports.parseGoogleCoord(googleCoords[i-1]),
            module.exports.parseGoogleCoord(googleCoords[i]),
            distance
          )
        );
      }
      trimmedCoords.push(googleCoords[i]);
    }
  }
  return trimmedCoords;
};
