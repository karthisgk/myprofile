const mongoose = require('mongoose');
const utils = require('../js/common');
const schema = new mongoose.Schema({
    _id: { type: String, default: utils.getMongoObjectId },
    title: {type: String, required: true},
    dadAmount: {type: Number, default: 0}
});

module.exports = mongoose.model("settings", schema);