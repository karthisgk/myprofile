const PRODUCTION = false;
module.exports = {
    PRODUCTION,
    liveUrl: PRODUCTION ? 'http://me.karthisgk.be/' : 'http://localhost:7070/',
    dbName: 'myprofile',
    dbUrl: PRODUCTION ? 'mongodb://localhost:27017' : 'mongodb://localhost:27017',
}