require("dotenv").config({ path: ".env" });
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const User = require("./userModel");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors());

function signToken(id) {
	return jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: process.env.TOKEN_EXPIRES,
	});
}

function createSendToken(user, statusCode, res) {
	const token = signToken(user._id);

	const cookieOptions = {
		expires: new Date(
			Date.now() + process.env.COOKIE_EXPIRES * 1000 * 60 * 60 * 24
		),
		httpOnly: true,
	};

	if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

	res.cookie("jwt", token, cookieOptions);

	user.password = undefined;

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
		// Creating the JWT for the user
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
		const reciveToken = req.cookies.jwt;
		console.log(reciveToken);
		const { email, password } = req.body;
		// Check if userid & password exist
		if (!email || !password) {
			throw new Error("Please provide email and password!", 400);
		}
		// Find user
		const user = await User.findOne({ email }).select("+password");

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

async function authrization(req, res, next) {
	try {
		const token = req.cookies.jwt;
		if (!token) {
			throw new Error("Need to be logged in for getting access!");
		}
		const data = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
		const user = await User.findById({ _id: data.id });
		req.user = user;
		next();
	} catch (err) {
		res.status(403).json({
			status: "fail",
			message: { err },
		});
	}
}

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

app.post("/signup", signup);

app.post("/login", login);

app.get("/secret", authrization, showSecret);
app.get("/", (req, res) => {
	return res.json({ message: "Hello World 🇵🇹 🤘" });
});

app.listen(2020, () => {
	console.log(`App running on port: 127.0.0.1:${2020}...`);
});
