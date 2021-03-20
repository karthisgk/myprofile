const mongoose = require('mongoose');
const util = require('../js/util.js');
const collectionName = 'users';
const userSchema = new mongoose.Schema({
	_id: { type: String, default: util.getMongoObjectId },
	firstName: String,
    lastName: String,
    userName: String,
	emailId: {
        type: String,
        trim: true,
        lowercase: true,
        default: '',
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'invalid email address']
    },
    mobileNumber: {
    	type: String,
    	trim: true,
    	unique: true,
        required: true,
    	validate: [util.validMobileNumber, 'invalid mobile number']
    },
    password: { salt: String,  hash: String },
    verificationMail: mongoose.Schema.Types.Mixed,
    aboutMe: { type: Array, default: [] },
    editor: {
        styles: String,
        content: String,
    },
    accessToken: { type: Array, default: [] },
    project: { type: Boolean, default: false },
    createdAt: { 
        date: { type: Date, default: Date.now },
        dateTime: { type: String, default: util.current_time },
        timeStamp: { type: Number, default: new Date().getTime() }
    }
});

userSchema.methods.validateToken = function(cb) {
	return this.model(collectionName).find(
        {accessToken: {$all: this.accessToken}},
        { password: 0, verificationMail : 0  },
        (err, data) => {
		cb(data.length > 0 ? data[0] : false);
	});
};

userSchema.methods.findByEmailId = function(cb) {
    return this.model(collectionName).find({emailId: this.emailId}, (err, data) => {
		cb(data.length > 0 ? data[0] : false);
    });
}

userSchema.methods.findByEmailIdOrUserName = function(cb) {
    return this.model(collectionName).find({$or: [
        {emailId: this.emailId},
        {userName: this.userName}
    ]}, (err, data) => {
		cb(data.length > 0 ? data[0] : false);
    });
}

userSchema.methods.updateUser = function(wh, updateData, cb) {
    return this.model(collectionName).updateMany(wh, { $set: updateData }, { runValidators: true }, cb);
}

userSchema.methods.getData = function(criteria = {}, cb) {
    var lookups = criteria.lookups && criteria.lookups.length ? criteria.lookups : [];
    if(criteria.condition && criteria.condition.length) {
        lookups.push({ $match: { $and: criteria.condition } });
    }
    lookups.push(util.userProjection);
    if(criteria.offset) {
		var lmt = typeof criteria.limit == 'undefined' ? 10 : parseInt(criteria.limit);
		lmt = parseInt(criteria.offset) + lmt;
		lookups.push({ $limit: parseInt(lmt)});
		lookups.push({ $skip: parseInt(criteria.offset)});
	}
    return this.model(collectionName).aggregate(lookups, cb);   
};

userSchema.methods.getById = function(cb) {
    return this.model(collectionName).findById(this._id, cb);
}

module.exports = mongoose.model(collectionName, userSchema);