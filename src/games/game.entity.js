const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Schema = mongoose.Schema;

const schema = new Schema({
    difficulty: {
        type: Number,
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
        type : Number,
        required: true
    }

}, { collection: 'games' });

schema.pre('save', function (next) {
    
    next();
})

module.exports = mongoose.model('Game', schema);