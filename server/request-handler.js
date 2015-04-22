var request = require('request');
var yelpHelper = require('./helpers/yelpFunctions');

// Queries Yelp with filtered Google coordinates (filterGoogle.js)
// Sends response of overall top 10 data
var performSearch = function(req, res, googleCoords, distance) {

  // yelpResults: Response from all Yelp queries
  yelpHelper.searchYelp(req, res, googleCoords, distance, function(yelpResults) {
    var topResults = yelpHelper.createTopResultsJSON(yelpResults, distance, googleCoords[0]);
    res.end(JSON.stringify(topResults));
  });
};

exports.performSearch = performSearch;
