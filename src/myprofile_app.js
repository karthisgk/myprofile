
var socket  = require( 'socket.io' );
var express = require('express');
var session = require('express-session');
var ServerSocket = require('./ServerSocket');
var appConfig = require('./config').initApp(__dirname);
var config = appConfig[process.env.NODE_ENV || 'development'];
var bodyParser = require('body-parser');
const { dbName, dbUrl } = require('./js/const');
const mongoose = require('mongoose');

var app = express();
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(session({
  secret: "mysqc",
  name: "mycookie",
  resave: true,
  proxy: true,
  saveUninitialized: true,
  duration: appConfig.session_time,
  activeDuration: appConfig.session_time,
  httpOnly: true,
  secure: true,
  ephemeral: true,
  cookie: {
    secure: false,
    maxAge: appConfig.session_time
  }
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true, limit: "20000mb" }));

app.use(function(req, res, next){
    res.header('Access-Control-Allow-Origin', 'http://me.karthisgk.be/');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
const baseRoutes = require('./routes');
const sgkRoutes = require('./routes/sgk');
app.use(baseRoutes);
app.use('/sgk', sgkRoutes);

var server  = require('http').createServer(app);
var io = socket.listen(server);
var sv = new ServerSocket(io);

async function startApp() { 
	await mongoose.connect( dbUrl + "/" + dbName, { 
		useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true
	});
	server.listen(config.port, '0.0.0.0');
	console.log("server listening at "+config.port);
}
startApp();