var util = require('../js/util.js');
var config = require('../config/index.js');
var path = require('path');
const fs = require('fs');
const UserModel = require('../models/user.js');

class UserController {

	model = UserModel;
	
	auth(token, cb){
		const user = new UserModel({ accessToken: [token] }); 
		user.validateToken(cb);
	}

	checkAccess() {
		return (req, res, next) => {
			if(!req.hasOwnProperty('accessToken') || !req.hasOwnProperty('accessUser')){
				res.json(util.getResponses('005', {}));
				return;
			}
			next();
		}
	}

	init() {
		const currentTime = util.current_time();
		const user = new UserModel({
			_id: util.getMongoObjectId(),
			firstName: 'karthi',
			lastName: 'sg',
			userName: 'karthisgk',
			emailId: 'karthisg.sg@gmail.com',
			mobileNumber: '9095169428',
			password: util.getPasswordHash('sgk97sgk'),
			createdAt: {
				date: new Date(currentTime),
				dateTime: currentTime,
				timeStamp: new Date(currentTime).getTime()
			}
		});
		const err = user.validateSync();
		if(err) {
			console.log(err);
		}
		user.save().then(doc => {
			console.log(doc, 'inserted');
		}).catch(e => {
			console.log(e, 'error');
		});
	}

};

UserController.prototype.logIn = (req, res, next) => {
	const reqBody = util.getPassFields(['userName', 'password'], req.body);
	if(!reqBody.userName || !reqBody.password) {
		res.json(util.getResponses('003', {}));
		return;
	}
	const user = new UserModel({emailId: reqBody.userName, userName: reqBody.userName});
	user.findByEmailIdOrUserName(userDoc => {
		if(userDoc) {
			if(util.validatePassword(userDoc.password, reqBody.password)) {
				const newAccessToken = util.getCrptoToken(32);
				userDoc.accessToken.push(newAccessToken);
				userDoc.save();
				req.newAccessToken = newAccessToken;
				next();
			} else {
				res.json(util.getResponses('034', {}));
			}
		} else {
			res.json(util.getResponses('004', {}));
		}
	});
}

UserController.prototype.getProfile = (req, res) => {
	var user = {...req.accessUser._doc};
	delete user.accessToken;
	res.json(util.getResponses('020', user));
};

UserController.prototype.updateUser = function(req, res) {
	const passField = ['firstName', 'lastName', 'emailId', 'mobileNumber', 'password', 'cpassword'];
	const reqBody = util.getPassFields(passField, req.body);
    Object.keys(reqBody).forEach(key => {
		if(['password', 'cpassword'].indexOf(key) == -1) {
			req.accessUser[key] = reqBody[key];
		}
	});
	var err = '';
	if(reqBody.password && reqBody.cpassword){
		if(reqBody.password == reqBody.cpassword) {
			req.accessUser.password = util.getPasswordHash(reqBody.password);
		} else {
			err = 'confirm password is missmatch';
		}
	}
    req.accessUser.save();
	res.json(util.getResponses('020', {err}));
};

UserController.prototype.logOut = function(req, res, next){
	var data = req.accessUser;
	var tokens = (data.accessToken && data.accessToken.length) ? data.accessToken : [];
    tokens.splice(tokens.indexOf(req.accessToken), 1);
    req.accessUser.accessToken = tokens;
    req.accessUser.save();
	next();
};

module.exports = UserController;