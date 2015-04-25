var chai = require('chai');

var assert = chai.assert;
var should = chai.should();
var expect = chai.expect;

var sample = require('./yelpSampleData');
var yelpHelpers = require('../../server/helpers/yelpFunctions');
var yelpHelpersOld = require('../../server/helpers/yelpFunctionsOld');

describe('Runs 1000 Times', function() {
  this.timeout(20000);
  var start, mid;
  var numTests = 1000;
  
  // It took 5603 milliseconds
  for (var i=0; i<numTests; i++) {
    +function(i) {
      it('should successfully execute 1000 times', function(done) {
        start = start || Date.now();
        expect(yelpHelpers.createTopResultsJSON(sample.yelpResults, sample.distance, sample.start).topTen.length).to.equal(30);
        if (i === numTests-1) {
          console.log('It took %d milliseconds', Date.now()-start);
        }
        done();
      });
    }(i);
  }

  // It took 2164 milliseconds
  for (var i=0; i<numTests; i++) {
    +function(i) {
      it('should successfully execute 1000 times', function(done) {
        mid = mid || Date.now();
        expect(yelpHelpersOld.createTopResultsJSON(sample.yelpResults, sample.distance, sample.start).topTen.length).to.equal(10);
        if (i === numTests-1) {
          console.log('It took %d milliseconds', Date.now()-mid);
        }
        done();
      });
    }(i);
  }
});