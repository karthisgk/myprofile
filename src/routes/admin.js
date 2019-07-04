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
	this.db = config.db;
}

Admin.prototype.index = function(req, res){
	if(req.hasOwnProperty('accessToken'))
		res.render('admin/index', {});
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

			var token = req.session.token;
			self.isValidAccessToken(token, (isValid, user) => {
				if(isValid){
					req.accessToken = token;
					req.accessUser = user;
					next();
				}
				else
					res.json(common.getResponses('011', {}));
			});

		}else
			next();
	};
};

Admin.prototype.isValidAccessToken = function(token, cb){
	this.db.get('settings', {accessToken: {$all: [token]}}, (data) => {
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

	this.db.get('settings', {}, data => {
		if(data.length > 0){
			data = data[0];
			if(data.userName == req.body.userName && 
				common.validatePassword(data.password, req.body.password)){
				var token = common.getCrptoToken(32);
				var tokens = !data.hasOwnProperty('accessToken') || typeof data.accessToken.length == 'undefined'
				|| typeof data.accessToken == 'string' ? [] : data.accessToken;
				tokens.push(token);
				req.session.token = token;
				self.db.update('settings', {}, {accessToken: tokens}, (err, result) => {
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
	self.db.update('settings', {}, {accessToken: tokens}, (err, result) => {
		res.json(common.getResponses('001', {}));
	});
};

module.exports = Admin;