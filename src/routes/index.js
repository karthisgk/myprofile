var appConfig = require('../config').initApp(__dirname);
var config = appConfig[process.env.NODE_ENV || 'development'];
var common = require('../public/common.js');
var multer  = require('multer');
var path = require('path');
const fs = require('fs');
var request = require('request');
var SMTP = require('../config/SMTPmailConfig.js');
var Admin = require('./admin.js');

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

String.prototype.isNumeric = function(){
  return /^[0-9]+$/.test(this);
};

String.prototype.isEmail = function(){
  var pattern = /^[a-zA-Z0-9\-_]+(\.[a-zA-Z0-9\-_]+)*@[a-z0-9]+(\-[a-z0-9]+)*(\.[a-z0-9]+(\-[a-z0-9]+)*)*\.[a-z]{2,4}$/;
  return pattern.test(this);
};

function Routes(app){
	var self = this;
	self.db = require('../config').db;
	Admin = new Admin();
	app.get('/', function(req, res){
		
		self.db.get('settings', {}, settings => {
			var sgk = {};
			if(settings.length > 0){
				sgk = settings[0];
				delete sgk.password;
				delete sgk.smtp_user;
				delete sgk.smtp_password;
				delete sgk.accessToken;
			}
			res.render('index', {sgk: sgk});
		});
	});

	app.post('/contactme', function(req, res) {
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
				    to: 'karthisg.sg2@gmail.com',
				    subject: 'contact-form - karthisgk.be' ,
				    html: d.html
				};
				smtp.sendMail(mail, (err, res) => {
					if (err) {console.log(err);}
					
				});
			});
		};
		self.db.get('settings', {}, (data) => {
			if(data.length > 0){
				data = data[0];
				var cfg = appConfig.smtp_config;
				cfg.auth.user = data.smtp_user;
				cfg.auth.pass = data.smtp_password;
				onSendMail(new SMTP(cfg));
			}
		});

		res.json({code: 'sgk_512', message: 'Contact details are submitted'});
	});

	app.get('/image/:img', function(req, res){

		if(!req.params.hasOwnProperty('img')){
			res.send('404 Error');
			return;
		}
		var imgPath = __dirname + '/../uploads/images/' + req.params.img;
		if (fs.existsSync(imgPath))
			res.sendFile(path.resolve(imgPath));
		else
			res.status(404).send('404 Error');
	});

	app.get('/sgk', Admin.auth(), Admin.index);

	app.get('/sgk/login', Admin.auth(), Admin.loginView);

	app.post('/sgk/login', Admin.loginApi);

	app.get('/sgk/logout', Admin.auth(), Admin.logOut);

	app.get('/sgk/getfile', Admin.auth(), Admin.getFile);

	app.post('/sgk/saveabout', Admin.auth(), Admin.saveAbout);

	app.post('/sgk/uploadfile', Admin.auth(), uploadFile.single('file'), Admin.uploadFile);
	
	app.get('/sgk/editor', Admin.auth(), Admin.editor);
	app.post('/sgk/editor', Admin.auth(), Admin.saveEditor);
	
	app.post('/resume', function(req, res) {
		self.db.get('settings', {}, settings => {
			if(settings.length > 0){
				settings = settings[0];
				var data = {
					title: settings.title,
					styles: '',
					content: ''
				};
				if(settings.editor){
					if(settings.editor.styles)
						data.styles = settings.editor.styles;

					if(settings.editor.content)
						data.content = settings.editor.content;
				}
				readFile(data);
			}else
				res.send('404 error');
		});
		function readFile(data) {
			fs.readFile(__dirname + '/../public/edited/index.html' , 'utf8', (err, html) => {
				if(err)
		 			res.send('404 error');
				else{
					var keys = [];
					for(var k in data)
						keys.push(k);
					if(keys.length > 0) {
						keys.forEach((dataKey, ind) => {
							html = html.replace(new RegExp('{{' + dataKey + '}}', 'g'), data[dataKey]);
						});
					}
					console.log(html);
					res.send(html);
				}
			});
		};
	});

	app.get('/profileimage', function(req, res){
		var html = '<form action="'+baseurl+'profileimage" method="post" enctype="multipart/form-data">\
		  <p><input type="file" name="prof">\
		  <p><button type="submit">Submit</button>\
		</form>';
		res.send(html);
	});

	app.post('/profileimage', upload.single('prof'), function(req, res){
		var file = req.file;				
		var imageExt = path.extname(file.path);
		imageFileName = 'sg' + imageExt;
		imageTargetPath = './src/public/resume/images/' + imageFileName;
		if (fs.existsSync(imageTargetPath))
			fs.unlinkSync(imageTargetPath);
		try {
       		fs.renameSync(file.path, imageTargetPath);
       		if (fs.existsSync(file.path))
				fs.unlinkSync(file.path);
       		res.redirect(baseurl + '/profileimage');
       	} catch (err) {
       		res.json(common.getResponses('003', {}));
			return;
       	}
	});

	self.r = app;
}

/*var fieds = { fieldname: 'photos',
  originalname: '7.JPG',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  destination: './src/public/uploads/tmp/',
  filename: 'photos-1555156134847.JPG',
  path: 'src/public/uploads/tmp/photos-1555156134847.JPG',
  size: 325768 }*/

module.exports = Routes;
