var yelp = require('./yelp');
var key = require('../api/api_key');
var coordHelpers = require('./coordinateHelpers');

// Creates Yelp client using Oauth
var yelpClient = yelp.createClient({
  consumer_key: process.env.KEY || key.consumer_key,
  consumer_secret: process.env.CONSUMER_SECRET || key.consumer_secret,
  token: process.env.TOKEN || key.token,
  token_secret: process.env.TOKEN_SECRET || key.token_secret,
  ssl: process.env.SSL || key.ssl
});

// Yelp search parameter configuration defaults
var yelpProperty = {
  term: "food",             // Type of business (food, restaurants, bars, etc.)
  limit: 10,                // Number of entries returned from each call
  sort: 2,                  // Sort mode: 0=Best matched (default), 1=Distance, 2=Highest Rated
  radius_filter: 5*1609.34  // Search radius: 1 mile = 1609.3 meters, 5 miles is good for rural areas
};

// Checks if a location is too common and should be filtered out
var commonFilter = ["McDonald's", "Burger King", "Jack in the Box", "Carl's Junior", "StarBucks", "Subway",
"Pizza Hut", "Del Taco", "Taco Bell", "Chick-fil-A", "Farm", "Truck", "In-N-Out", "Wendys", "Arbys", "KFC",
"Sonic", "Dairy Queen", "Chevron", "Popeyes", "Cracker Barrel", "Quiznos", "IHOP",
"International House of Pancakes", "Dennys"];

var commonFilterHash = {};
for (var i=0; i<commonFilter.length; i++) {
  commonFilterHash[commonFilter[i]] = true;
}

function isCommonPlace(businessEntry){
  return !!commonFilterHash[businessEntry.name];
}

// Use Yelp API to get top locations (based on longitude and latitude)
module.exports.searchYelp = function (req, res, googleCoords, distance, callback) {

  var yelpResults = [];      // Query results from Yelp
  var completedQueries = 0;  // Number of completed Yelp Queries

  var trimmedCoords = coordHelpers.trimGoogleCoord(googleCoords, distance);

  // Yelp search parameter configuration
  yelpProperty.term = req.body.optionFilter;

  // Sets radius_filter to distance (in miles) / 25, with a floor of 2 and a ceiling of 25. Convert to meters.
  yelpProperty.radius_filter = coordHelpers.radiusFilter(distance)*1609.34;

  // Queries Yelp for each point returned by filterGoogle.js
  // yelpClient.search is async, so closure scope maintains the value of i
  for(var i = 0; i < trimmedCoords.length; i++){
    (function(i) {
      yelpClient.search({
        term: yelpProperty.term,
        limit: yelpProperty.limit,
        sort: yelpProperty.sort,
        radius_filter: yelpProperty.radius_filter,
        ll: trimmedCoords[i]
      }, function(error, data) {
        if (error) {
          console.log(error);
        }
        //Pushes the data returned from Yelp into yelpResults array
        yelpResults[i] = data;
        completedQueries++;
        //After all yelp results are received call callback with those results
        if(completedQueries === trimmedCoords.length){
          callback(yelpResults);
        }
     });
    })(i);
  }
};

// Filters Yelp results into an overall top 10
module.exports.createTopResultsJSON = function(yelpResults, distance, start) {
  // Use this code to save a copy of a representative data set for testing  
  // var fs = require('fs');
  // fs.writeFile(__dirname+'/../../test/server/yelpSampleData.js',
  //   'module.exports = { yelpResults: '+JSON.stringify(yelpResults)+', distance: '+JSON.stringify(distance)+', start: '+JSON.stringify(start)+'};',
  //   function(err) {
  //   if (err) {
  //     console.error(err);
  //   }
  //   console.log('File saved!');
  // });

  var allBusinesses = [];

  // Pushes all businesses from yelpResults into one array for easy filtering
  for(var i = 0; i < yelpResults.length; i++){
    if(yelpResults[i].businesses){
      allBusinesses = allBusinesses.concat(yelpResults[i].businesses);
    }
  }

  // Checks if business is in range or is commonplace
  allBusinesses = allBusinesses.filter(function(business) {
    return business.distance <= yelpProperty.radius_filter && !isCommonPlace(business);
  });

  // Finds the top results algorithm
  var findTopResults = function() {
    var topResults = [];

    // Compares ratings, and then reviews. Sort by string id afterwards for easy duplicate detection
    allBusinesses.sort(function(a, b) {
      return b.rating - a.rating || b.review_count - a.review_count ||
        (b.id > a.id ? 1 : b.id === a.id ? 0 : -1);
    });

    // Eliminate duplicates
    for (var j=1; j<allBusinesses.length; j++) {
      if (allBusinesses[j-1].name === allBusinesses[j].name) {
        allBusinesses.splice(j, 1);
        j--;
      }
    }

    // Limits to top 30 results
    // Splice over slice to prevent repeating with findEvenSpreadResults
    topResults = allBusinesses.splice(0, 30);
    return topResults;
  };

  // Finds results with the evenSpread algorithm
  var findEvenSpreadResults = function() {

    // Sort by distance to start to ensure spread. Problematic if optimal path is windy
    allBusinesses.sort(function(a, b) {
      return coordHelpers.calcDistance(coordHelpers.parseGoogleCoord(start), a) - coordHelpers.calcDistance(coordHelpers.parseGoogleCoord(start), b);
    });

    var evenSpreadResults =[];

    // Pushes the starting point result to the array
    evenSpreadResults[0] = allBusinesses[0];

    for (var m = 1; m < allBusinesses.length; m++) {

      // Skips waypoints less than total distance/20 away
      if (coordHelpers.calcDistance(evenSpreadResults[evenSpreadResults.length-1], allBusinesses[m]) < (distance / 20)) {
        continue;
      }

      // Skips any business with a rating lower than 4
      // Skips any business with less than 5 reviews
      if (allBusinesses[m].rating < 4 || allBusinesses[m].review_count < 5) {
        continue;
      }

      // Pushes the result to the array
      evenSpreadResults.push(allBusinesses[m]);

      // If we have 20 entries, skips the remaining
      if (evenSpreadResults.length >= 20) {
        break;
      }
    }
    return evenSpreadResults;
  };


  // Combines the best results along the road with the even spread results along the roads
  var topResults = findTopResults();
  var evenSpreadResults = findEvenSpreadResults();

  return {
    results: evenSpreadResults,
    topTen: topResults
  };
};
