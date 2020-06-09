const express = require('express');
const app = express.Router();
const sgkController = new (require('../controllers/sgk'));
const userController = new (require('../controllers/user'));
const util = require('../js/util');
const { getSettings } = require('../config');
var path = require('path');
const fs = require('fs');
const multer  = require('multer');

const uploadFile = multer({ storage: multer.diskStorage({
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

app.get('/', getSettings, sgkController.auth(), sgkController.index);

app.get('/login', sgkController.auth(), sgkController.loginView);

app.post('/login', userController.logIn, sgkController.loginApi);

app.get('/logout', sgkController.auth(), userController.checkAccess(), userController.logOut, sgkController.logOut);

app.get('/getfile', sgkController.auth(), sgkController.getFile);

app.post('/saveabout', sgkController.auth(), userController.checkAccess(), sgkController.saveAbout);

app.post('/uploadfile', sgkController.auth(), uploadFile.single('file'), sgkController.uploadFile);

app.post('/uploadfiles', sgkController.auth(), userController.checkAccess(), util.uploader({uploadDir: 'files/'}).array('file'), (req, res) => {
	res.json(req.files);
});

app.get('/editor', sgkController.auth(), sgkController.editor);
app.post('/editor', sgkController.auth(), sgkController.saveEditor);
module.exports = app;