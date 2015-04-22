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
    {name: 'Parks', value: "active, parks"},
    {name: 'Pets', value:"pets"}
  ];

  // Sets default filter to "food"
  $scope.optionFilter = $scope.optionSelections[1].value;

  // Used for determining valid continental destination or not
  $scope.geoCodeNotSuccessful = false;

  $scope.distance = "";
  $scope.time = "";

  // Cache will be to store the distances from origin for the TopTop attractions
  // Since each will require a Google API query, in order to minimize re-queries,
  // the initial result will be stored in cache
  $scope.cache = {};

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


  //Queries Google for directions services and generates map
  $scope.calcRoute = function (start, end) {
      console.log("Calculating Route...");

      // New directionsService object to interact with Google maps API
      var directionsService = new google.maps.DirectionsService(start,end);

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

        directionsService.route(request(), function(response, status) {

        // successfully get the direction based on locations
        if (status === google.maps.DirectionsStatus.OK) {

          $scope.geoCodeNotSuccessful=false;

          //Updates the map on index.html
          directionsDisplay.setDirections(response);

          // Data to be sent to backend
          var mapData = {
            // Use distance.value/1609.34 because distance.text is in mi for USA and in km elsewhere
            distance: response.routes[0].legs[0].distance.value/1609.34,
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
            Utility.placemarkers(res.data.results.concat(res.data.topTen.slice(0, 10)));
            $scope.topTen = res.data.topTen;
          });

        } else {

          // Sets the geoCodeNotSuccessful to true
          $scope.geoCodeNotSuccessful = true;

          // Appends the warning message to main.html
          $scope.appendWarningMsg($scope.geoCodeNotSuccessful);
        }
      });
     };


  // Runs when a user hits the submit button
  $scope.submit = function() {

    var startGeo, endGeo;

    $scope.geoCodeNotSuccessful = false;
    $element.find("main-area").empty();

    $scope.calcRoute($scope.location.start, $scope.location.end);

    };
}]);
