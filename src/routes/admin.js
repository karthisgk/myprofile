var common = require('../public/common.js');
var ObjectId = require('mongodb').ObjectId;
var config = require('../config/index.js');
var path = require('path');
const fs = require('fs');

String.prototype.isNumeric = function(){
  return /^[0-9]+$/.test(this);
};

String.prototype.isEmail = function(){
  var pattern = /^[a-zA-Z0-9\-_]+(\.[a-zA-Z0-9\-_]+)*@[a-z0-9]+(\-[a-z0-9]+)*(\.[a-z0-9]+(\-[a-z0-9]+)*)*\.[a-z]{2,4}$/;
  return pattern.test(this);
};

function Admin() {
	config.db = config.db;
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
	var self = this;
	return function(req, res, next){

		if(req.session.hasOwnProperty('token')){

			if(req.session.accessToken == ''){
				next();
				return;
			}

			var token = req.session.token;
			self.isValidAccessToken(token, (isValid, user) => {
				if(isValid){
					req.accessToken = token;
					req.accessUser = user;
					next();
				}
				else
					next();
			});

		}else
			next();
	};
};

Admin.prototype.isValidAccessToken = function(token, cb){
	config.db.get('settings', {accessToken: {$all: [token]}}, (data) => {
		if(data.length > 0)
		    cb(true, data[0]);
		else
			cb(false, data);
	});
};

Admin.prototype.loginApi = function(req, res){
	var self = this;
	if(!req.body.userName ||
		!req.body.password){
		res.json(common.getResponses('002', {}));
		return;
	}

	config.db.get('settings', {}, data => {
		if(data.length > 0){
			data = data[0];
			if(data.userName == req.body.userName && 
				common.validatePassword(data.password, req.body.password)){
				var token = common.getCrptoToken(32);
				var tokens = !data.hasOwnProperty('accessToken') || typeof data.accessToken.length == 'undefined'
				|| typeof data.accessToken == 'string' ? [] : data.accessToken;
				tokens.push(token);
				req.session.token = token;
				config.db.update('settings', {}, {accessToken: tokens}, (err, result) => {
					res.json(common.getResponses('001', {accessToken: token}));
				});		
			}else
				res.json(common.getResponses('010', {}));
		}else
			res.json(common.getResponses('010', {}));
	});
};

Admin.prototype.logOut = function(req, res){
	if(!req.hasOwnProperty('accessToken') || !req.hasOwnProperty('accessUser')){
		res.json(common.getResponses('011', {}));
		return;
	}

	var data = req.accessUser;
	var tokens = !data.hasOwnProperty('accessToken') || typeof data.accessToken.length == 'undefined'
		|| typeof data.accessToken == 'string' ? [] : data.accessToken;
	tokens.splice(tokens.indexOf(req.accessToken), 1);
	config.db.update('settings', {}, {accessToken: tokens}, (err, result) => {
		delete req.session.accessToken;
		res.json(common.getResponses('001', {}));
	});
};

Admin.prototype.saveAbout = function(req, res) {
	if(!req.hasOwnProperty('accessToken') || !req.hasOwnProperty('accessUser')){
		res.json(common.getResponses('011', {}));
		return;
	}

	if(!req.body.aboutMe){
		res.json(common.getResponses('002', {}));
		return;
	}

	config.db.update('settings', {}, {aboutMe: req.body.aboutMe}, (err, result) => {
		res.json(common.getResponses('001', {}));
	});
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
	config.db.update('settings', {}, {editor: dt}, (err, result) => {
		res.json(common.getResponses('001', {}));
	});
};

Admin.prototype.getResume = function(cb){
 	return function(req, res) {
		config.db.get('settings', {}, settings => {
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
