angular.module('app', ['autofill-directive', 'ngRoute', 'app.service'])

.controller('mapCtrl', ['$scope', '$element', 'Utility', function($scope, $element, Utility) {

  // Initializes the user input option selector
  $scope.optionSelections = [
    {name: 'Everything', value:""},
    {name: 'Food', value:"food"},
    {name: 'NightLife', value:"nightlife"},
    {name: 'Shopping', value:"shopping"},
    {name: 'Medical', value:"medical"},
    {name: 'Gas', value:"gas"},
    {name: 'Pets', value:"pets"}
  ];

  // Sets default filter to "food"
  $scope.optionFilter = $scope.optionSelections[1].value;

  // Used for determining valid continental destination or not
  $scope.geoCodeNotSuccessful = false;

  $scope.distance = "";
  $scope.time = "";

  $scope.appendWarningMsg = function(isInvalid) {

    // Invalid message template
    var pInvalid = angular.element("<p id='warningMsg'/>");
    pInvalid.text("Please choose a continental location and resubmit");

    // Valid message template
    var pValid = angular.element("<p id='warningMsg'/>");
    pValid.text("");

    // Append invalid string if the input is invalid
    if (isInvalid) {
      $element.find("main-area").append(pInvalid);
    } else {
      $element.find("main-area").append(pValid);
    }
  };

  // Runs when a user hits the submit button
  $scope.submit = function(city) {

    var startGeo, endGeo;

    $scope.geoCodeNotSuccessful = false;
    $element.find("main-area").empty();
    calcRoute();

    function calcRoute() {

      // New directionsService object to interact with google maps API
      var directionsService = new google.maps.DirectionsService();

      // clear markers whenever new search
      for (var i = 0; i < markerArray.length; i++) {
        markerArray[i].setMap(null);
      }

      // Creates object to send to Google to generate directions, sub-route
      var request = function(start, end){
        return {
        origin: start || $scope.location.start,
        destination: end || $scope.location.end,
        travelMode: google.maps.TravelMode.DRIVING};
      };

      // Sends request to Google Maps Directions API
      directionsService.route(request(), function(response, status) {

        // successfully get the direction based on locations
        if (status === google.maps.DirectionsStatus.OK) {

          $scope.geoCodeNotSuccessful=false;

          //Updates the map on index.html
          directionsDisplay.setDirections(response);

          // Data to be sent to backend
          var mapData = {
            distance: response.routes[0].legs[0].distance.text,
            optionFilter: $scope.optionFilter,
            waypoints: []
          };

          // Gathers all points along route returned by Google in overview_path property
          // Inserts them into the mapData object
          for (var j = 0; j < response.routes[0].overview_path.length; j++) {
            mapData.waypoints[j] = response.routes[0].overview_path[j].k + "," + response.routes[0].overview_path[j].D;
          }

          $scope.distance = response.routes[0].legs[0].distance.text.replace('mi', 'miles').replace("km", "kilometers");
          $scope.duration = response.routes[0].legs[0].duration.text;

          // Appends the blank (no warning) message to main.html
          $scope.appendWarningMsg($scope.geoCodeNotSuccessful);

          // Sends all waypoints along route to server
          Utility.sendMapData(mapData)

          // Receives Yelp reccomendations and displays as markers
          .then(function(res){
            Utility.placemarkers(res.data.results);
            $scope.topTen = res.data.topTen;
          });

        } else {

          // Sets the geoCodeNotSuccessful to true
          $scope.geoCodeNotSuccessful = true;

          // Appends the warning message to main.html
          $scope.appendWarningMsg($scope.geoCodeNotSuccessful);
        }
      });
    }
  };
}]);
