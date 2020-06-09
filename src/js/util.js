var ObjectId = require('mongodb').ObjectId;
const mongoose = require('mongoose');
var SMTP = require('../config/SMTPmailConfig.js');
var multer  = require('multer');
var path = require('path');
const fs = require('fs');
String.prototype.getCharCode = function(){
	var rt=[];
	for(var i=0;i<this.length;i++){
		rt.push(this.charCodeAt(i));
	}
	return rt;
};

const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

function encrypt(text) {
 let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
 let encrypted = cipher.update(text);
 encrypted = Buffer.concat([encrypted, cipher.final()]);
 return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

function decrypt(text) {
 let iv = Buffer.from(text.iv, 'hex');
 let encryptedText = Buffer.from(text.encryptedData, 'hex');
 let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
 let decrypted = decipher.update(encryptedText);
 decrypted = Buffer.concat([decrypted, decipher.final()]);
 return decrypted.toString();
}

var codeKey = 'SGK_';
var responses = [
	{
		code: codeKey + '001',
		message: 'Data\'s Inserted',
		data: {}
	},
	{
			code: codeKey + '002',
			message: 'Data\'s Updated',
			data: {}
	},
	{
			code: codeKey + '003',
			message: 'Wrong Input',
			data: {}
	},
	{
			code: codeKey + '004',
			message: 'Invalid User',
			data: {}
	},
	{
			code: codeKey + '005',
			message: 'Invalid Access Token',
			data: {}
	},
	{
			code: codeKey + '006',
			message: 'Invalid Token',
			data: {}
	},
	{
			code: codeKey + '007',
			message: 'Token Expired',
			data: {}
	},
	{
			code: codeKey + '008',
			message: 'You Have Already a User. We will send you a mail for generate your new password',
			data: {}
	},
	{
			code: codeKey + '009',
			message: 'User Created Successfull. We will send you a mail for activate your account',
			data: {}
	},
	{
			code: codeKey + '015',
			message: 'Email Address Already Exist!',
			data: {}
	},
	{
			code: codeKey + '016',
			message: 'Mobile Number Already Exist',
			data: {}
	},
	{
			code: codeKey + '017',
			message: 'Invalid Email Address',
			data: {}
	},
	{
			code: codeKey + '019',
			message: 'Data\'s Missing',
			data: {}
	},
	{
			code: codeKey + '020',
			message: 'Success',
			data: {}
	},
	{
			code: codeKey + '022',
			message: 'Mobile Number\'s Required',
			data: {}
	},
	{
			code: codeKey + '023',
			message: 'Account Does\'nt Activated',
			data: {}
	},
	{
			code: codeKey + '024',
			message: 'Access Token Removed',
			data: {}
	},
	{
			code: codeKey + '025',
			message: 'Confirm Password Mismatch!',
			data: {}
	},
	{
			code: codeKey + '027',
			message: 'This is a valid token',
			data: {}
	},
	{
			code: codeKey + '028',
			message: 'Password Updated',
			data: {}
	},
	{
			code: codeKey + '029',
			message: 'We will send you a mail for reset your password',
			data: {}
	},
	{
			code: codeKey + '030',
			message: 'Email Address & Mobile Number Already Exist!',
			data: {}
	},
	{
			code: codeKey + '034',
			message: 'Wrong Password!',
			data: {}
	},
	{
			code: codeKey + '035',
			message: 'Error File Upload',
			data: {}
	},
	{
			code: codeKey + '036',
			message: 'File type miss match. Must upload png, jpg, jpeg or pdf',
			data: {}
	},
	{
			code: codeKey + '037',
			message: 'Access Denied!',
			data: {}
	},
	{
			code: codeKey + '038',
			message: 'File type miss match. Must upload png, jpg, jpeg',
			data: {}
	},
	{
			code: codeKey + '039',
			message: 'Incorrect User Id',
			data: {}
	},
	{
			code: codeKey + '040',
			message: 'User Deleted Successfull',
			data: {}
	},
	{
			code: codeKey + '041',
			message: 'Service is not Available',
			data: {}
	},
	{
			code: codeKey + '042',
			message: 'Must Upload Atleast one image',
			data: {}
	},
	{
			code: codeKey + '043',
			message: 'Profile is not exist!',
			data: {}
	},
	{
			code: codeKey + '044',
			message: 'File too large!',
			data: {}
	},
	{
		code: codeKey + '045',
		message: 'validate schema error',
		data: {}
	},
	{
		code: codeKey + '046',
		message: 'slug is already exist',
		data: {}
	}
];

var common = {
	userProjection: { $project : { password: 0, verificationMail : 0 , accessToken : 0 } },
	encrypt: encrypt,
	decrypt: decrypt,
	frontEndUrl: 'http://localhost:8080/',
	uniqueid: function() {
		  function s4() {
		    return Math.floor((1 + Math.random()) * 0x10000)
		      .toString(16)
		      .substring(1);
		  }
		  return s4();
	},
	generateOTP: function() {

	    var digits = '0123456789';

	    var otpLength = 6;

	    var otp = '';

	    for(let i=1; i<=otpLength; i++)

	    {

	        var index = Math.floor(Math.random()*(digits.length));

	        otp = otp + digits[index];

	    }

	    return otp;

	},
	validMobileNumber: (num) => {
		if(typeof num == "string" && num.length < 10) {
			return false;
		}
		if(!/^[0-9]+$/.test(num)){
			return false;
		}
		return true;
	},
	current_time: function(t) {
		/*sudo timedatectl set-timezone Asia/Kolkata*/
		  var t = typeof t === 'undefined' ? '' : t;
		  if(t != '')
		    t = typeof t !== 'object' ? new Date( t ) : t;
		  var time = t == '' ? new Date() : t;
		  var date = 
		    time.getFullYear() +'-'+ 
		    ('0' + (time.getMonth() + 1)).slice(-2) +'-'+
		    ('0' + time.getDate()).slice(-2);
		  var format = 
		    ("0" + time.getHours()).slice(-2)   + ":" + 
		    ("0" + time.getMinutes()).slice(-2) + ":" + 
		    ("0" + time.getSeconds()).slice(-2);
		  return date+' '+format;
	},
	addHours: function(t, h) {    
	   t.setTime(t.getTime() + (h*60*60*1000)); 
	   return t;   
	},
	getMongoObjectId: function(){
		return mongoose.Types.ObjectId().toString();
	},
	getUserType: function(ind){
		var UserType = [ 1,2 ];
		return typeof UserType[ind] == 'undefined' ? UserType : UserType[ind];
	},
	gToken: function(n = 10){
		var rand = function() {
    		return Math.random().toString(36).substr(2);
		};

		return (rand()+rand()+rand()+rand()+rand()+rand()+rand()+rand()
			+rand()+rand()+rand()+rand()+rand()+rand()+rand()
			+rand()+rand()+rand()+rand()+rand()+rand()+rand()
			+rand()+rand()+rand()+rand()+rand()+rand()+rand()).substr(0,n);
	},
	sendEMail: function(cfg, cb = () => {}){
		var smtp = new SMTP(cfg);
	    smtp.getFile({title: 'contact-form', content: cfg.content ? cfg.content : ''}, (d) => {
			var mail = {
			    from: cfg.auth.user,
			    to: cfg.to,
			    subject: cfg.subject ? cfg.subject : '' ,
			    html: d.html
			};
			smtp.sendMail(mail, (err, res) => {
				if (err) {console.log(err);}
				cb();
			});
		});
	},
	getResponses(c, data){
		var rt = {};
		responses.forEach((d, k) => {
			if(d.code == codeKey + c){
				d.data = data;
				rt = d;
			}
		});
		return rt;
	},
	getPassFields: function(passField = [], actualFields = {}) {
		var fields = {};
		Object.keys(actualFields).forEach(key => {
			if(passField.indexOf(key) > -1){
				fields[key] = actualFields[key];
			}
		});
		return fields;
	},
	isJson: function(str) {
		try {
			return JSON.parse(str);
		}catch(e) {}
		return false;
	},
	getCrptoToken: function(n = 16){
		return crypto.randomBytes(n).toString('hex');
	},
	getPasswordHash: function(password){
		var salt = crypto.randomBytes(16).toString('hex');
	    return {salt: salt, hash: crypto.pbkdf2Sync(password, salt,  
	    1000, 64, `sha512`).toString(`hex`)};
	},
	validatePassword: function(exist, password){

		if(!exist.salt || !exist.hash)
			return false;

		var hash = crypto.pbkdf2Sync(password,  
	    exist.salt, 1000, 64, `sha512`).toString(`hex`); 
	    return exist.hash === hash;
	},
	getCharCode: function(str){
		return str.getCharCode();
	},
	getFileUploadMiddleware: function(cfg = {}){
		var storage = multer.diskStorage({
			destination: function (req, file, cb) {
				var uploadDir = cfg.uploadDir ? cfg.uploadDir : 'tmp/';
				var dir = './src/uploads/' + uploadDir;
				if (!fs.existsSync(dir)){
				    fs.mkdirSync(dir);
				}
			    cb(null, dir);
			},
			filename: function (req, file, cb) {
				var fileName = 'dvs_' + common.gToken(15) + '-' + Date.now();
				if(cfg.fileName)
					fileName = cfg.fileName + common.gToken(6);
				if(req.fileName)
					fileName = req.fileName + common.gToken(6);
				fileName = fileName + path.extname(file.originalname);
			    cb(null, fileName);
			}
		});
		var upload = multer({ storage: storage, 
		limits: { fieldSize: 25 * 1024 * 1024 },
		fileFilter: function (req, file, cb) {
		    if(['image/png', 'image/jpg', 'image/jpeg'].indexOf(file.mimetype) != -1){
		    	cb(null, true);
		    	return;
			}else{
				//req.json(common.getResponses('MNS036', {}));
				req.fileError = '035';
				return cb(null, false, new Error('Not an image'));
			}
		} });
		return upload;
	},
	videoUpload: function(cfg = {}){
		var storage = multer.diskStorage({
			destination: function (req, file, cb) {
				var uploadDir = cfg.uploadDir ? cfg.uploadDir : 'tmp/';
				var dir = './src/uploads/' + uploadDir;
				if (!fs.existsSync(dir)){
				    fs.mkdirSync(dir);
				}
			    cb(null, dir);
			},
			filename: function (req, file, cb) {
				var fileName = 'dvs_' + common.gToken(15) + '-' + Date.now();
				if(cfg.fileName)
					fileName = cfg.fileName + common.gToken(6);
				if(req.fileName)
					fileName = req.fileName + common.gToken(6);
				fileName = fileName + path.extname(file.originalname);
			    cb(null, fileName);
			}
		});
		var upload = multer({ storage: storage, 
		limits: { fieldSize: 25 * 1024 * 1024 },
		fileFilter: function (req, file, cb) {
		    if(/^video/ig.test(file.mimetype)){
		    	cb(null, true);
		    	return;
			}else{
				//req.json(common.getResponses('MNS036', {}));
				req.fileError = '035';
				return cb(null, false, new Error('Not an video'));
			}
		} });
		return upload;
	},
	uploader: function(cfg = {}){
		var storage = multer.diskStorage({
			destination: function (req, file, cb) {
				var uploadDir = cfg.uploadDir ? cfg.uploadDir : 'tmp/';
				var dir = './src/uploads/' + uploadDir;
				if (!fs.existsSync(dir)){
				    fs.mkdirSync(dir);
				}
			    cb(null, dir);
			},
			filename: function (req, file, cb) {
			    cb(null, file.originalname);
			}
		});;
		return multer({ storage: storage });
	},
};

module.exports = common;