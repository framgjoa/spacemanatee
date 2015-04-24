var chai = require('chai');
var request = require('supertest');
var app = require('../../server.js');
var sample = require('./sampleData.js');

var assert = chai.assert;
var should = chai.should();
var expect = chai.expect;

describe('Tests Basic Routes', function(){

  it('should successfully get the home page', function(done) {
    request(app)
      .get('/')
      .end(function(error, response){
        if(error){ throw error; }
        response.status.should.equal(200);
        done();
      });
  });

  it('should successfully get the index page', function(done) {
    request(app)
      .get('/main')
      .end(function(error, response){
        if(error){ throw error; }
        response.status.should.equal(200);
        done();
      });
  });

  it('should successfully redirect bad GET requests to the home page', function(done) {
    request(app)
      .get('/asdaasvasd')
      .end(function(error, response){
        if(error){ throw error; }
        response.status.should.equal(302);
        done();
      });
  });

  it('should successfully redirect bad POST requests to the home page', function(done) {
    request(app)
      .post('/asdaasvasd')
      .end(function(error, response){
        if(error){ throw error; }
        response.status.should.equal(302);
        done();
      });
  });

  it('should successfully post to /search', function(done) {
    this.timeout(20000);
    var start = Date.now();
    request(app)
      .post('/search')
      .send(sample.waypoints[0])
      .end(function(error, response){
        if(error){ throw error; }
        response.status.should.equal(200);
        console.log('Milliseconds elapsed:', Date.now()-start);
        done();
      });
  });
});
