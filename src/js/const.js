const PRODUCTION = true;
module.exports = {
    PRODUCTION,
    liveUrl: PRODUCTION ? 'http://13.229.55.192/' : 'http://192.168.43.97:7071/',
    dbName: 'myprofile',
    dbUrl: PRODUCTION ? 'mongodb://localhost:27017' : 'mongodb://localhost:27017',
}