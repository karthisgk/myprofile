var appConfig = require('../config').initApp(__dirname);
var config = require('../config');
const { getSettings } = config;
var common = require('../js/common.js');
var multer  = require('multer');
var path = require('path');
const fs = require('fs');
var SMTP = require('../config/SMTPmailConfig.js');
var sgkController = new (require('../controllers/sgk.js'));
var pdf = require('html-pdf');
const express = require('express');
const app = express.Router();
const userController = new (require('../controllers/user'));

var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		var dir = './src/uploads/tmp/';
		if (!fs.existsSync(dir)){
		    fs.mkdirSync(dir);
		}
	    cb(null, dir);
	},
	filename: function (req, file, cb) {
	    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
	}
});
var upload = multer({ storage: storage, 
	fileFilter: function (req, file, cb) {
	    if(['image/png', 'image/jpg', 'image/jpeg'].indexOf(file.mimetype) != -1){
	    	cb(null, true);
	    	return;
		}else{
			//req.json(common.getResponses('MNS036', {}));
			req.fileError = '004';
			return cb(null, false, new Error('Not an image'));
		}
	} });

var uploadFile = multer({ storage: multer.diskStorage({
	destination: function (req, file, cb) {
		var dir = './src/uploads/tmp/';
		if (!fs.existsSync(dir)){
		    fs.mkdirSync(dir);
		}
	    cb(null, dir);
	},
	filename: function (req, file, cb) {
	    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
	}
}) });

var passData = {};
var baseurl = appConfig.liveUrl;
const {liveUrl} = require('../js/const')

String.prototype.isNumeric = function(){
  return /^[0-9]+$/.test(this);
};

String.prototype.isEmail = function(){
  var pattern = /^[a-zA-Z0-9\-_]+(\.[a-zA-Z0-9\-_]+)*@[a-z0-9]+(\-[a-z0-9]+)*(\.[a-z0-9]+(\-[a-z0-9]+)*)*\.[a-z]{2,4}$/;
  return pattern.test(this);
};

app.get('/', (req, res) => {
	res.render('index', {sgk: false});
});

app.post('/contactme', getSettings, function(req, res) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type');

	if(!req.body.name ||
		!req.body.emailAddress ||
		!req.body.message){
		res.json({code: 'sgk_003', message: 'Wrong Input'});
		return;
	}


	var onSendMail = function(smtp){
		var adminMail = appConfig.smtp_config.auth.user;
		var content = '<h3>'+ req.body.name +'</h3>';
		content += '<h4>' + req.body.emailAddress + '</h4>'; 
		content += '<p>' + req.body.message + '</p>';
		smtp.getFile({title: 'contact-form', content: content}, (d) => {
			var mail = {
				from: adminMail,
				to: 'karthisg.sg@gmail.com',
				subject: 'contact-form - karthisgk.be' ,
				html: d.html
			};
			smtp.sendMail(mail, (err, res) => {
				if (err) {console.log(err);}
			});
		});
	};
	const proceed = function(data) {
		if(data.length > 0){
			data = data[0];
			var cfg = appConfig.smtp_config;
			cfg.auth.user = data.smtp_user;
			cfg.auth.pass = data.smtp_password;
			onSendMail(new SMTP(cfg));
		}
	}(req.generalSettings);

	res.json({code: 'sgk_512', message: 'Contact details are submitted'});
});

app.post('/localchat/verify', (req, res) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type');

	if(!req.body.emailAddress){
		res.json({code: '003', message: 'Wrong Input'});
		return;
	}

	const s4 = () => {
		return Math.floor((1 + Math.random()) * 0x10000)
		.toString(16)
		.substring(1);
	};
	const otp = s4();
	var onSendMail = function(smtp){
		var adminMail = appConfig.smtp_config.auth.user;
		var content = '';
		content += '<h1>Hi, ' + req.body.emailAddress.split('@')[0] + '</h1>'; 
		content += '<p> your otp: </p><br><p>' + otp + '</p>';
		smtp.getFile({title: 'contact-form', content: content}, (d) => {
			var mail = {
				from: adminMail,
				to: req.body.emailAddress,
				subject: 'Verification!' ,
				html: d.html
			};
			smtp.sendMail(mail, (err, res) => {
				if (err) {console.log(err);}
				
			});
		});
	};

	config.db.get('settings', {}, (data) => {
		if(data.length > 0){
			data = data[0];
			var cfg = appConfig.smtp_config;
			cfg.auth.user = data.smtp_user2 ? data.smtp_user2 : data.smtp_user;
			cfg.auth.pass = data.smtp_password;
			onSendMail(new SMTP(cfg));
		}
	});

	res.json({code: '020', message: 'success', otp: otp});
});

app.get('/storage/:dir/:img', function(req, res){

	if(!req.params.hasOwnProperty('img')){
		res.send('404 Error');
		return;
	}

	var imgPath = __dirname + '/../uploads/' + req.params.dir + '/' + req.params.img;
	if (fs.existsSync(imgPath))
		res.sendFile(path.resolve(imgPath));
	else
		res.status(404).send('404 Error');
});

app.get('/resume', getSettings, sgkController.getResume((res, html) => {
	res.send(html);
}));

app.get('/edited/karthik_resume.pdf', getSettings, sgkController.getResume((res, html) => {
	var saveFile = './src/public/' + 'karthik_resume.pdf';
	if (fs.existsSync(saveFile))
			fs.unlinkSync(saveFile);
	pdf.create(html, { format: 'Letter' }).toFile(saveFile, function(err, result) {
		if (err) return console.log(err);
		if (fs.existsSync(saveFile))
			res.sendFile(path.resolve(saveFile));
		else
			res.status(404).send('404 Error');
	});
}));


app.get('/ff', function(req, res){
	const fs = require('fs');

	fs.readdir(path.join(__dirname, '../uploads/files'), (err, files) => {
		var respp = "";
		files.forEach(file => {
			respp += '<div><a href="http://192.168.43.157:7071/storage/files/'+file+'" target="_blank">' + file + '</a></div>';
		});
		res.send(respp);
	});
})

app.get('/movies', function(req, res){
	const fs = require('fs');

	fs.readdir(path.join(__dirname, '../public/movie'), (err, files) => {
		var respp = "";
		files.forEach(file => {
			respp += '<div><a href="'+liveUrl+'movie/'+file+'" target="_blank">' + file + '</a></div>';
		});
		res.send(respp);
	});
})

/*var fieds = { fieldname: 'photos',
  originalname: '7.JPG',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  destination: './src/public/uploads/tmp/',
  filename: 'photos-1555156134847.JPG',
  path: 'src/public/uploads/tmp/photos-1555156134847.JPG',
  size: 325768 }*/

module.exports = app;
