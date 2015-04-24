var chai = require('chai');

var assert = chai.assert;
var should = chai.should();
var expect = chai.expect;

var sample = require('./yelpSampleData');
var yelpHelpers = require('../../server/helpers/yelpFunctions');


describe('Runs Ten Times', function() {
  this.timeout(10000);
  var start = Date.now();
  var numTests = 1000;
  for (var i=0; i<numTests; i++) {
    +function(i) {
      it('should successfully execute ten times', function() {
        expect(yelpHelpers.createTopResultsJSON(sample.yelpResults, sample.distance, sample.start).topTen.length).to.equal(30);
        if (i === numTests-1) {
          console.log('It took %d milliseconds', Date.now()-start);
        }
      });
    }(i);
  }
});

// 1000 trials: It took 5317 milliseconds SF - NY, everything