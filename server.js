var express = require('express');
var bodyParser = require('body-parser');
var router = require('./server/router');
var app = express();

// Sets port variable to provided port, defaulting to 3456 when none is given
var port = process.env.PORT || 3456;

// Set dirname to client folder to serve static assets (index.html)
app.use('/', express.static(__dirname + '/client'));

// Parses all incoming data to JSON
app.use(bodyParser.json());

// Sends all calls to router function
app.use(router);

app.listen(port, function() {
  console.log("Listening on port " + port + "...");
});

module.exports = app;
