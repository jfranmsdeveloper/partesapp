const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for Google Auth
    googleId: { type: String },
    role: { type: String, default: 'user' }
});

module.exports = mongoose.model('User', UserSchema);
