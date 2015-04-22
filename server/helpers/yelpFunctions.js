var yelp = require('./yelp');
var key = require('../api/api_key');
var coord = require('./coordinateHelpers');

// create yelp client using Oauth
var yelpClient = yelp.createClient({
  consumer_key: process.env.KEY || key.consumer_key,
  consumer_secret: process.env.CONSUMER_SECRET || key.consumer_secret,
  token: process.env.TOKEN || key.token,
  token_secret: process.env.TOKEN_SECRET || key.token_secret,
  ssl: process.env.SSL || key.ssl
});

// Yelp search parameter configuration defaults
var yelpProperty = {
  term: "food",             // Type of business (food, restaurants, bars, hotels, etc.)
  limit: 10,                // Number of entries returned from each call
  sort: 2,                  // Sort mode: 0=Best matched (default), 1=Distance, 2=Highest Rated
  radius_filter: 5*1609.34  // Search radius: 1 mile = 1609.3 meters, 5 miles is good for rural areas
};

// check if a place is a common place to be filtered out
var commonFilter = ["McDonald's", "Burger King", "Jack in the Box", "Carl's Junior", "StarBucks", "Subway",
"Pizza Hut", "Del Taco", "Taco Bell", "Chick-fil-A", "Farm", "Truck", "In-N-Out"];

var commonFilterHash = {};
for (var i=0; i<commonFilter.length; i++) {
  commonFilterHash[commonFilter[i]] = true;
}

function isCommonPlace(businessEntry){
  return !!commonFilterHash[businessEntry.name];
}

// function to use yelp API to get the top choices based on longitude and latitude
module.exports.searchYelp = function (req, res, googleCoords, distance, callback) {
  //Counter variable which will keep track of how many Yelp calls have completed
  //A separate counter is needed due to the asynchronous nature of web requests
  var trimmedCoords = coord.trimGoogleCoord(googleCoords, distance);
  var counter = 0;
  // Array that stores all of the Yelp results from all calls to Yelp
  var yelpResults = [];

  // yelp search parameter configuration
  yelpProperty.term = req.body.optionFilter;           // Type of business (food, restaurants, bars, hotels, etc.)

  if (distance <= 20) {
    yelpProperty.radius_filter = 0.8 * 1609.34 ;
  } else if (distance <= 40) {
    yelpProperty.radius_filter = 2.5 * 1609.34;
  } else {
    yelpProperty.radius_filter = 5 * 1609.34;
  }

  //Request yelp for each point along route that is returned by filterGoogle.js
  for(var i = 0; i < trimmedCoords.length; i++){
    //yelpClient.search is asynchronous and so we must use a closure scope to maintain the value of i
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
        //Push the data returned from Yelp into yelpResults array
        yelpResults[i] = data;
        counter++;
        //After all yelp results are received call callback with those results
        if(counter === trimmedCoords.length){
          callback(yelpResults);
        }
     });
    })(i);
  }
};

//Filter results returned from Yelp into an overall top 10
module.exports.createTopResultsJSON = function(yelpResults, distance) {
  var allBusinesses = [];
  var topResults = [];
  var minRating = 0;
  var evenSpreadResults =[];
  var sortedResults;

  //Push all businesses from yelpResults into one array for easy filtering
  for(var i = 0; i < yelpResults.length; i++){
    if(yelpResults[i].businesses){
      allBusinesses = allBusinesses.concat(yelpResults[i].businesses);
    }
  }

  // Checks if business is in range or is commonplace
  allBusinesses = allBusinesses.filter(function(business) {
    return business.distance <= yelpProperty.radius_filter && !isCommonPlace(business);
  });

  // Compares ratings, and then reviews
  sortedResults = allBusinesses.sort(function(a, b) {
    return b.rating - a.rating || b.review_count - a.review_count;
  });

  // Eliminate duplicates
  for (var j=1; j<sortedResults.length; j++) {
    if (sortedResults[j-1].name === sortedResults[j].name) {
      sortedResults.splice(j, 1);
      j--;
    }
  }

  // Limits to 10
  topResults = sortedResults.slice(0, 10);

  // start the evenSpread algorithm to create a new array of results, which will be combined later with the topResults
  evenSpreadResults[0] = allBusinesses[0]; // push the starting point result to the array

  for (var m = 1; m < allBusinesses.length; m++) {
    // if next waypoint less than total distance/20 mi away
    if (coord.calcDistance(evenSpreadResults[evenSpreadResults.length-1], allBusinesses[m]) < (distance / 20)) {
      // then skip
      continue;
    }
    if (allBusinesses[m].rating < 4 || allBusinesses[m].review_count < 5) {
      // or if the rating is less than 4
      // or if the review count is less than 5
      // then skip
      continue;
    }
    // push the result to the array, start looking for the next entry
    evenSpreadResults.push(allBusinesses[m]);
    if (evenSpreadResults.length >= 20) { // if have 20 entries , exit the for loop
      break;
    }
  }

  // combine the best results along the road with the even spread results along the roads
  var finalResults = evenSpreadResults.concat(topResults);

  return {
    results: finalResults,
    topTen: topResults
  };
};
