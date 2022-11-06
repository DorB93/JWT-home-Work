const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "Please tell us your name!"],
	},
	email: {
		type: String,
		unique: true,
		required: [true, "Please provide your email!"],
	},
	password: {
		type: String,
		required: [true, "Please provide a password"],
		select: false,
	},
});

const User = mongoose.model("User", userSchema);

module.exports = User;
