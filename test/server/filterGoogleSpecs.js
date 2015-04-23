var chai = require('chai');
var filter = require('../../server/filters/filterGoogle');
var sample = require('./sampleData.js');

var assert = chai.assert;
var should = chai.should();
var expect = chai.expect;

describe('Tests Basic Routes', function(){

  it('should return filtered results from Google', function() {

    // Check SF to NY
    var data0 = filter(sample.waypoints[0]);
    expect(data0.distance > 2500).to.equal(true);
    expect(data0.distance < 3000).to.equal(true);
    expect(typeof data0.filteredCoords).to.equal('object');
    expect(data0.filteredCoords === sample.waypoints[0].waypoints).to.equal(false);

    // Check LA to Alaska
    var data1 = filter(sample.waypoints[1]);
    expect(data1.distance > 3000).to.equal(true);
    expect(data1.distance < 3500).to.equal(true);
    expect(typeof data1.filteredCoords).to.equal('object');
    expect(data1.filteredCoords === sample.waypoints[1].waypoints).to.equal(false);

    // Check Liverpool to London
    var data2 = filter(sample.waypoints[2]);
    expect(data2.distance > 150).to.equal(true);
    expect(data2.distance < 300).to.equal(true);
    expect(typeof data2.filteredCoords).to.equal('object');
    expect(data2.filteredCoords === sample.waypoints[2].waypoints).to.equal(false);
  });
});
