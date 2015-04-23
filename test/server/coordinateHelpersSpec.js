var chai = require('chai');

var assert = chai.assert;
var should = chai.should();
var expect = chai.expect;

var coordHelpers = require('../../server/helpers/coordinateHelpers');

var points = {0: "38.44543,-122.70404", 1: "38.445330000000006,-122.70454000000001", 2: "38.445330000000006,-122.70497", 3: "38.445310000000006,-122.70526000000001", 4: "38.44534,-122.70687000000001", 5: "38.44538,-122.70812000000001", 6: "38.44552,-122.71350000000001", 7: "38.44565,-122.71795000000002", 8: "38.445780000000006,-122.72254000000001", 9: "38.44581,-122.72310000000002"};

describe('coordinateHelpers', function() {
  it('should calculate the correct distance', function() {
    var distance = coordHelpers.calcDistance(coordHelpers.parseGoogleCoord(points[0]), coordHelpers.parseGoogleCoord(points[9]));
    var actualDistance = 1.0317427825546628;
    expect(Math.abs((actualDistance-distance)/actualDistance) < 0.01).to.equal(true);
  });
});
