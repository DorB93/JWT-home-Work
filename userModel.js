const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "Please tell us your name!"],
	},

	email: {
		type: String,
		unique: true,
		required: [true, "Please provide your email!"],
		validate: [validator.isEmail, "Please provide a valid email!"],
	},

	password: {
		type: String,
		required: [true, "Please provide a password"],
		// will not return the password to the client
		select: false,
	},
});

userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();
	this.password = await bcrypt.hash(this.password, 12);
	next();
});

userSchema.methods.correctPassword = async function (
	candidatePassword,
	userPassword
) {
	return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
