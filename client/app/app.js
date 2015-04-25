angular.module('app', ['ngFx', 'autofill-directive', 'ngRoute', 'app.service'])
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

  // Calculates the cumulative distance to each TopTop attraction from origin
  // Assigns the cumDist property to each TopTen object

  var cumulativeDistance = function(start, end, i){

    var tempRequest = {
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode.DRIVING
    };

    var directionsService = new google.maps.DirectionsService();
    var subRoute = directionsService.route(tempRequest, function(result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        //console.log("Status OK");

        var tempResult = result;

        // Store distance based on location in array for each TopTen
        $scope.topTen[i].cumDist = tempResult.routes[0].legs[0].distance.text;
        $scope.$apply();
        //console.log("TopTen[",i,"] ", $scope.topTen[i].cumDist);

      }
    });
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
      case "": return "white";
      case "food": return "orange";
      case "nightlife": return "black";
      case "shopping": return "yellow";
      case "medical": return "blue";
      case "gas": return "red";
      case "active, parks": return "green";
      case "pets": return "brown";
      default: return "red";
    }
  };

  // Callback function
  $scope.overallRouteCalc = function(res){
    var color = $scope.selectColor($scope.currentOption);

    Utility.placemarkers(res.data.results, {size: 'sm', color: color});
    Utility.placemarkers(res.data.topTen.slice(0, 10), {size: 'lg', color: color}, res.data.results.length);
    $scope.topTen = res.data.topTen;

    // Passing a postal code as use of the Lat/Long object rejected by Google API
    // Use of postal code is a quicker approximation. Works outside of US

    //Loops over all topTen results and assigns their cumulative distance
    for(var i = 0; i <$scope.topTen.length; i++){
      cumulativeDistance($scope.location.start, $scope.topTen[i].location.postal_code, i);
    }

    // console.log("Final topTen objects", $scope.topTen);
  };

  //Queries Google for directions services and generates map
  $scope.calcRoute = function (start, end, cb) {
      //console.log("Calculating Route...");

      cb = cb || $scope.overallRouteCalc;

      // New directionsService object to interact with Google maps API
      var directionsService = new google.maps.DirectionsService(start,end);
      // Clear markers whenever new search
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
        // Successfully get the direction based on locations
        if (status === google.maps.DirectionsStatus.OK) {
          $scope.geoCodeNotSuccessful=false;

          // Updates the map on index.html
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
          .then(cb);
        } else {
          // Sets the geoCodeNotSuccessful to true
          $scope.geoCodeNotSuccessful = true;
          // Appends the warning message to main.html
          $scope.appendWarningMsg($scope.geoCodeNotSuccessful);
        }
      });
     };
  // Declaring the top ten arrayu that we can reference later
  // var topTenArr;

  // var removeSelection = function(index) {
  //   topTenArr.splice(index, 0);
  //   return topTenArr;
  // }

  // Runs when a user hits the submit button
  $scope.submit = function() {
    var startGeo, endGeo;
    $scope.geoCodeNotSuccessful = false;
    $element.find("main-area").empty();
    delete $scope.topTen;
    $scope.calcRoute($scope.location.start, $scope.location.end);
  };
}]);
