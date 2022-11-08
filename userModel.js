const mongoose = require("mongoose");
// const validator = require('validator');

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "Please tell us your name!"],
	},
	email: {
		type: String,
		unique: true,
		required: [true, "Please provide your email!"],
		// validate: [validator.isEmail, 'Please provide a valid email!'],
	},
	password: {
		type: String,
		required: [true, "Please provide a password"],
		// will not return the password to the client
		select: false,
	},
});

const User = mongoose.model("User", userSchema);

module.exports = User;
