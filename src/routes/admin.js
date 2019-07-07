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

module.exports = Admin;