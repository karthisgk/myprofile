var common = require('../js/common.js');
const util = require('../js/util');
var config = require('../config/index.js');
var path = require('path');
const fs = require('fs');
const userController = new (require('./user'));

String.prototype.isNumeric = function(){
  return /^[0-9]+$/.test(this);
};

String.prototype.isEmail = function(){
  var pattern = /^[a-zA-Z0-9\-_]+(\.[a-zA-Z0-9\-_]+)*@[a-z0-9]+(\-[a-z0-9]+)*(\.[a-z0-9]+(\-[a-z0-9]+)*)*\.[a-z]{2,4}$/;
  return pattern.test(this);
};

function Admin() {
}

Admin.prototype.index = function(req, res){
	if(req.hasOwnProperty('accessToken')){
		var dt = {
			accessToken: req.accessToken,
			liveUrl: config.liveUrl,
			admin: req.accessUser
		};
		res.render('admin/index', dt);
	}
	else
		res.redirect('/sgk/login');
};

Admin.prototype.loginView = function(req, res) {
	if(!req.hasOwnProperty('accessToken'))
		res.render('admin/login', {});
	else
		res.redirect('/sgk');
};

Admin.prototype.auth = function(){
	return function(req, res, next){
		req.session.accessToken = 'sgk97sgk';
		if(req.session.hasOwnProperty("accessToken")){

			if(req.session.accessToken == ''){
				next();
				return;
			}

			var token = req.session.accessToken;
			userController.auth(token, accessUser => {
				if(accessUser) {
					req.accessToken = token;
					req.accessUser = accessUser;
					next();
				}
				else
					res.json(util.getResponses('005', {}));
			});

		}else
			next();
	};
};

Admin.prototype.loginApi = function(req, res){
	req.session.accessToken = req.newAccessToken;
	res.json(util.getResponses('020', {accessToken: req.newAccessToken}));
};

Admin.prototype.logOut = function(req, res){
	delete req.session.accessToken;
	res.json(util.getResponses('020', {}));
};

Admin.prototype.saveAbout = function(req, res) {

	if(!req.body.aboutMe){
		res.json(common.getResponses('002', {}));
		return;
	}

	req.accessUser.aboutMe = req.body.aboutMe;
	req.accessUser.save();
	res.json(common.getResponses('001', {}));
};

Admin.prototype.getFile = function(req, res) {

	if(!req.hasOwnProperty('accessToken') || !req.hasOwnProperty('accessUser')){
		res.redirect('/sgk/login');
		return;
	}

	if(!req.query.hasOwnProperty('file')){
		var dt = {
			accessToken: req.accessToken,
			liveUrl: config.liveUrl,
			admin: req.accessUser
		};
		res.render('admin/getfile', dt);
		return;
	}
	
	var filePath = __dirname + '/../' + req.query.file;
	if (fs.existsSync(filePath))
		res.sendFile(path.resolve(filePath));
	else
		res.send('404 Error');
};

Admin.prototype.uploadFile = function(req, res) {	

	if(!req.file){
		res.json(common.getResponses('002', {}));
		return;
	}	
	
	if(!req.file.path || !req.body.targetfile){
		res.json(common.getResponses('002', {}));
		return;
	}

	var removeUpload = function(){
		if (fs.existsSync(req.file.path))
			fs.unlinkSync(req.file.path);
	};

	var filePath = __dirname + '/../' + req.body.targetfile;
	if(!req.hasOwnProperty('accessToken') || !req.hasOwnProperty('accessUser')){
		removeUpload();
		res.json(common.getResponses('012', {}));
		return;
	}

	if(typeof req.fileError != 'undefined'){
		removeUpload();
		res.json(common.getResponses('003', {}));
		return;
	}

	try {

		if (fs.existsSync(filePath))
		    fs.unlinkSync(filePath);

		fs.renameSync(req.file.path, filePath);
			res.json(common.getResponses('001', {}));
   		
   	} catch (err) {
   		removeUpload();
		res.json(common.getResponses('003', {}));
		return;
   	}
};

Admin.prototype.editor = function(req, res) {
	if(!req.hasOwnProperty('accessToken') || !req.hasOwnProperty('accessUser')){
		res.redirect('/sgk/login');
		return;
	}


	var data = {
		title: req.accessUser.title,
		styles: '',
		content: '',
		accessToken: req.accessToken,
		liveUrl: config.liveUrl,
		admin: req.accessUser
	};
	
	if(req.accessUser.editor){
		if(req.accessUser.editor.styles)
			data.styles = req.accessUser.editor.styles;
		
		if(req.accessUser.editor.content)
			data.content = req.accessUser.editor.content;
	}

	res.render('admin/editor', data);
};

Admin.prototype.saveEditor = function(req, res){
	if(!req.hasOwnProperty('accessToken') || !req.hasOwnProperty('accessUser')){
		res.redirect('/sgk/login');
		return;
	}

	if(!req.body.styles || !req.body.content){
		res.json(common.getResponses('002', {}));
		return;
	}

	var dt = {
		styles: req.body.styles,
		content: req.body.content
	};
	req.accessUser.editor = dt;
	req.accessUser.save();
	res.json(common.getResponses('001', {}));
};

Admin.prototype.getResume = function(cb){
 	return function(req, res) {
		userController.model.find({project: true}, (err, profiles) => {
			if(profiles.length){
				const profile = profiles[0];
				var data = {
					title: req.generalSettings.title,
					styles: '',
					content: ''
				};
				if(profile.editor){
					if(profile.editor.styles)
						data.styles = profile.editor.styles;

					if(profile.editor.content)
						data.content = profile.editor.content;
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
					cb(res, html);
				}
			});
		};
	}
};

/*config.db.insert('settings', {
	"title" : "karthisgk", "smtp_password" : "vijisgk97", "smtp_user" : "karthisg.sg@gmail.com", "userName" : "karthisgk",
	password: common.getPasswordHash('vijisgk97')
}, (err, res) => {});*/

module.exports = Admin;
