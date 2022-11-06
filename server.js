require("dotenv").config({ path: ".env" });
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const User = require("./userModel");
const cors = require("cors");

// create the app
const app = express();

// global midlleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());

/**
 * function for creating jwt token
 * @param {String} id
 * @returns JWT token
 */
function signToken(id) {
	return jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: process.env.TOKEN_EXPIRES,
	});
}

/**
 * function for creating res for login & signup
 * @param {Object} user
 * @param {Number} statusCode
 * @param {Function} res
 */
function createSendToken(user, statusCode, res) {
	// Create the token
	const token = signToken(user._id);

	const cookieOptions = {
		expires: new Date(
			Date.now() + process.env.COOKIE_EXPIRES * 1000 * 60 * 60 * 24
		),
		httpOnly: true,
	};
	// in production we need to make sure the only web can reach to our server
	if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

	// Sending the cookie to the client
	res.cookie("jwt", token, cookieOptions);
	// Remove the password from the rsponse
	user.password = undefined;
	// send the responde to the client
	res.status(statusCode).json({
		status: "success",
		data: {
			user,
		},
	});
}

// Routes Handler
async function signup(req, res) {
	try {
		// Creating the user in mongoDB
		const newUser = await User.create({
			name: req.body.name,
			email: req.body.email,
			password: req.body.password,
		});

		createSendToken(newUser, 201, res);
	} catch (err) {
		console.log(err);
		res.status(400).json({
			status: "fail",
			message: err,
		});
	}
}

async function login(req, res) {
	try {
		const { email, password } = req.body;
		// Check if email & password exist
		if (!email || !password) {
			throw new Error("Please provide email and password!", 400);
		}
		// Find user with the password that stor in mongoDB
		const user = await User.findOne({ email }).select("+password");

		// Check if that email belong to any user & if the password matchs
		if (!user || !password === user.password) {
			throw new Error("Incorrect userID or password");
		}

		createSendToken(user, 200, res);
	} catch (err) {
		console.log(err);
		res.status(401).json({
			status: "fail",
			message: err.message,
		});
	}
}

// Middleware
async function authrization(req, res, next) {
	try {
		// Get the JWT from the cookis
		const token = req.cookies.jwt;

		// Chack if it exists
		if (!token) {
			throw new Error("Need to be logged in for getting access!");
		}
		// Verify the token with the SECRET
		const data = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

		// Get the user with the ID that pass in the token
		const user = await User.findById({ _id: data.id });

		// Push the user data to the request for the next function
		req.user = user;

		next();
	} catch (err) {
		res.status(403).json({
			status: "fail",
			message: { err },
		});
	}
}

// Show something only to login users
function showSecret(req, res) {
	res.status(200).json({
		status: "success",
		message: `You know the secret! ${req.user.name}:)`,
	});
}

// Connecting to MongoDB
mongoose.connect("mongodb://localhost:27017/JWT_HW").then(() => {
	console.log("MongoDB connected successfuly!");
});

// the route that i am using
app.post("/signup", signup);
app.post("/login", login);
app.get("/secret", authrization, showSecret);

app.listen(2020, () => {
	console.log(`App running on port: 127.0.0.1:${2020}...`);
});
