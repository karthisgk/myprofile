const mongoose = require('mongoose');
const util = require('../js/util.js');
const collectionName = 'blogs';
const blogSchema = new mongoose.Schema({
	_id: { type: String, default: util.getMongoObjectId },
    title: {type: String, required: true},
    slug: { type: String, required: true },
    description: String,
    coverImage: String,
    content: {type: String, required: true},
    comments: { type: Boolean, default: false },
    createdAt: { 
        date: { type: Date, default: Date.now },
        dateTime: { type: String, default: util.current_time },
        timeStamp: { type: Number, default: new Date().getTime() }
    }
});

blogSchema.methods.findBySlug = function(cb) {
    const $wh = {slug: this.slug};
    if(this._id && this._id != null) {
        $wh._id = {$ne: this._id};
    }
    return this.model(collectionName).find($wh, (err, data) => {
		cb(data.length > 0 ? data[0] : false);
    });
};

blogSchema.methods.getData = function(criteria = {}, cb) {
    var lookups = criteria.lookups && criteria.lookups.length ? criteria.lookups : [];
    if(criteria.condition && criteria.condition.length) {
        lookups.push({ $match: { $and: criteria.condition } });
    }
    if(criteria.offset) {
		var lmt = typeof criteria.limit == 'undefined' ? 10 : parseInt(criteria.limit);
		lmt = parseInt(criteria.offset) + lmt;
		lookups.push({ $limit: parseInt(lmt)});
		lookups.push({ $skip: parseInt(criteria.offset)});
	}
    return this.model(collectionName).aggregate(lookups, cb);   
};

blogSchema.methods.getById = function(cb) {
    return this.model(collectionName).findById(this._id, cb);
}

module.exports = mongoose.model(collectionName, blogSchema);