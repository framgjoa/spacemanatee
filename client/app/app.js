angular.module('app', ['autofill-directive', 'ngRoute', 'app.service'])

.controller('mapCtrl', ['$scope', '$element', 'Utility', function($scope, $element, Utility) {
  //initialize the user input option selector
  $scope.optionSelections = [
    {name: 'Everything', value:""},
    {name: 'Food', value:"food"},
    {name: 'NightLife', value:"nightlife"},
    {name: 'Shopping', value:"shopping"},
    {name: 'Medical', value:"medical"},
    {name: 'Gas', value:"gas"},
    {name: 'Pets', value:"pets"}
  ];
  //set default option filter to "food"
  $scope.optionFilter = $scope.optionSelections[1].value;
  //initialize the geoCodeNotSuccessful to be used for determining valid continental destination or not
  $scope.geoCodeNotSuccessful = false;
  $scope.distance = "";
  $scope.time = "";

  $scope.appendWarningMsg = function(isInvalid) {
    // invalid message template
    var pInvalid = angular.element("<p id='warningMsg'/>");
    pInvalid.text("Please choose a continental location and resubmit");
    // valid message template
    var pValid = angular.element("<p id='warningMsg'/>");
    pValid.text("");

    //if location is invalid, then append invalid message
    if (isInvalid) {
      $element.find("main-area").append(pInvalid);
    } else {
      $element.find("main-area").append(pValid);
    }
  };

  $scope.submit = function(city) {
    $scope.geoCodeNotSuccessful = false;  // every time when submit button is pressed, reset the geoCodeNotSuccessful to false
    $element.find("main-area").empty();   // clear out the warning messages from previous location input

    var startGeo, endGeo;

    var calcRoute = function() {
      // New directionsService object to interact with google maps API
      var directionsService = new google.maps.DirectionsService();
      // clear markers whenever new search
      for (var i = 0; i < markerArray.length; i++) {
        markerArray[i].setMap(null);
      }

      // create object to send to Google to generate directions
      var request = {
        origin: $scope.location.start,
        destination: $scope.location.end,
        travelMode: google.maps.TravelMode.DRIVING
      };

      //send request to Google Maps Directions API with request object as data
      directionsService.route(request, function(response, status) {
        // successfully get the direction based on locations
        if (status === google.maps.DirectionsStatus.OK) {
          $scope.geoCodeNotSuccessful=false;
          //Update the map on index.html
          directionsDisplay.setDirections(response);

          // objects to be sent to backend
          var mapData = {
            distance: response.routes[0].legs[0].distance.text,
            optionFilter: $scope.optionFilter,
            waypoints: []
          };

          //gather all points along route returned by Google in overview_path property
          //and insert them into waypoints object to send to server
          for (var j = 0; j < response.routes[0].overview_path.length; j++) {
            mapData.waypoints[j] = response.routes[0].overview_path[j].k + "," + response.routes[0].overview_path[j].D;
          }

          $scope.distance = response.routes[0].legs[0].distance.text.replace('mi', 'miles').replace("km", "kilometers");
          $scope.duration = response.routes[0].legs[0].duration.text;
          $scope.appendWarningMsg($scope.geoCodeNotSuccessful); // append the blank (no warning) message to main.html

          // Send all waypoints along route to server
          Utility.sendMapData(mapData)
          .then(function(res){
            // get back recommendations from Yelp and display as markers
            Utility.placemarkers(res.data.results);
            $scope.topTen = res.data.topTen;
          });
        } else {
          //Log the status code on error
          console.log("Geocode was not successful: " + status);
          //set the geoCodeNotSuccessful to true
          $scope.geoCodeNotSuccessful = true;
          $scope.appendWarningMsg($scope.geoCodeNotSuccessful); // append the warning message to main.html
        }
      });
    };

    calcRoute();

  };
}]);
