const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Schema = mongoose.Schema;

const schema = new Schema({
    difficulty: {
        type: String,
        required: true,
    },

    mines: {
        type: Array,
        required : true,
    },

    opened: {
        type: Array,
        required : true,
    },

    user: {
        type: Schema.Types.ObjectId,
        required : true,
        ref: "User"
    },

    status:{
        type : String,
        required: true
    },

    startTimeStamp :{
        type : Number,
        required: true
    },
    
    endTimeStamp :{
        type : Number,
        required: false
    },

}, { collection: 'games' });

schema.pre('save', function (next) {
    
    next();
})

module.exports = mongoose.model('Game', schema);