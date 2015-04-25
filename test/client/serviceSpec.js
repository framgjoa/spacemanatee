describe('Utility', function () {

  var routeObject = {
    distance: 5,
    optionFilter: "food",
    waypoints: ["3731,-99.97184000000001", "40.69252,-99.52081000000001", "40.672430000000006,-99.19506000000001", "40.725530000000006,-98.67558000000001", "40.82323,-98.40098"]
    };

  var Utility, $httpBackend;
  beforeEach(module('app.service'));
  beforeEach(inject(function (_Utility_, _$httpBackend_) {
    Utility = _Utility_;
    $httpBackend = _$httpBackend_;
  }));

  describe('Maps', function () {
    it('sends Map Data', function () {
      $httpBackend
      .expectPOST('/search', routeObject)
      .respond(200);
      var succeeded = false;

      Utility.sendMapData(routeObject)
      .then(function() {
        succeeded = true;
      });
      $httpBackend.flush();
      expect(succeeded).to.equal(true);
    });
  });
});

