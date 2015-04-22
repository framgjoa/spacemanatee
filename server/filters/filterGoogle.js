// Filters Google coordinates into a filtered coordinates for Yelp requests
var filter = function(requestBody){

  var googleCoords = requestBody.waypoints;
  var totalTripDistance = requestBody.distance;
  var distanceBetweenQueries; //  The distance between each yelp query in miles
  var distanceBetweenPoints = totalTripDistance / googleCoords.length;

  //  Adjusts the distance between queries if the trip distance is less than 20 miles
  if (totalTripDistance <= 20) {
    distanceBetweenQueries = totalTripDistance /10;
  } else {
    distanceBetweenQueries = 10;
  }

  var counter = 0;
  var filteredCoords = [];

  // Loops through each coordinate along the route
  // Adds the coordinates that are distanceBetweenQueries apart
  for (var i = 0; i < googleCoords.length; i++){
    if(counter > distanceBetweenQueries){
      filteredCoords.push(googleCoords[i]);
      counter = 0;
    } else {
      counter += distanceBetweenPoints;
    }
  }

  return {
    distance: totalTripDistance,
    filteredCoords:filteredCoords
  };
};

module.exports = filter;
