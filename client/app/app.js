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

  // Takes the TopTop array and calculates cumulative distance per location
  // Caches result so the refresh function does not re-query to save API time
  $scope.cumulativeDistance = function(){
  //   console.log("topTen: ", $scope.topTen);
  //   for (var i = 0; i < $scope.topTen.length; i++){
  //     console.log("Cumulative Distance: ",  i, $scope.topTen);
  //   }


  };

  $scope.remove = function($index) {
    $scope.topTen.splice($index, 1);
    markerArrayTop.splice($index, 1)[0].setMap(null);
    if ($scope.topTen.length >= 10) {
      Utility.placemarkers($scope.topTen[9], {size: 'lg', color: $scope.selectColor($scope.currentOption)});
    }
  };

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

  $scope.selectColor = function(currentOption) {
    switch (currentOption) {
      case "": return "white"; break;
      case "food": return "orange"; break;
      case "nightlife": return "black"; break;
      case "shopping": return "yellow"; break;
      case "medical": return "blue"; break;
      case "gas": return "red"; break;
      case "active, parks": return "green"; break;
      case "pets": return "brown"; break;
      default: return "red";
    }
  };


  //Queries Google for directions services and generates map
  $scope.calcRoute = function (start, end) {
      console.log("Calculating Route...");

      // New directionsService object to interact with Google maps API
      var directionsService = new google.maps.DirectionsService(start,end);

      // clear markers whenever new search
      for (var i = 0; i < markerArraySpread.length; i++) {
        markerArraySpread[i].setMap(null);
      }
      for (var j = 0; j < markerArrayTop.length; j++) {
        markerArrayTop[j].setMap(null);
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

          // Save it for drawing map
          $scope.currentOption = $scope.optionFilter;

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

          // Receives Yelp recommendations and displays as markers
          .then(function(res){
            var color = $scope.selectColor($scope.currentOption);            

            Utility.placemarkers(res.data.results, {size: 'sm', color: color});
            Utility.placemarkers(res.data.topTen.slice(0, 10), {size: 'lg', color: color}, res.data.results.length);
            $scope.topTen = res.data.topTen;
            console.log("CB topTen: ", $scope.topTen);
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

    $scope.cumulativeDistance();
    };
}]);
