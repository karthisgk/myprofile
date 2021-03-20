
var DB = require('./db');
var SMTP = require('./SMTPmailConfig.js');
const { liveUrl } = require('../js/const');

var main = {
	card: {
		// no: 5242 7200 1333 4735,
		// exp: 5/25,
		// name: KARTHICK,
		// CVV: 274
	},
	development: {
		name: 'Karthik SG',
		port: process.env.PORT || 7071
	},
	production: {
		name: 'Karthik SG',
		port: process.env.PORT || 7071
	},
	db: new DB(),
	smtp_config: {
	    host: "smtp.gmail.com",
	    port: 465,
	    secure: true, 
	    auth: {
	        user: "",
	        pass: ""
	    }
	},
	session_time: 999999999999,
	liveUrl: liveUrl,
	frontEndUrl: 'http://localhost:8080/',
	initApp: function(dir){
		main.app_dir = dir;
		return main;
	},
	setSMTPConfig: function(cb){
		main.db.get('settings', {}, (settings) => {
			var smtp;
			if(settings.length > 0)
				smtp = new SMTP(settings[0].smtp_config);
			else
				smtp = new SMTP(main.smtp_config);
			cb(smtp);
		});
	},
	getSettings: (req, res, next) => {
		new DB().get('settings', {}, settings => {
			if(settings.length) {
				req.generalSettings = settings[0];
				next();
			} else {
				res.status(400);
				res.send('None shall pass');
			}
		});
	}
};

module.exports = main;
