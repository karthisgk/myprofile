const PRODUCTION = false;
module.exports = {
    PRODUCTION,
    liveUrl: PRODUCTION ? 'http://13.229.55.192/' : 'http://karthi.sg/',
    dbName: 'myprofile',
    dbUrl: PRODUCTION ? 'mongodb://localhost:27017' : 'mongodb://localhost:27017',
}