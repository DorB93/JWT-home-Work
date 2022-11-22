const jwt = require("jsonwebtoken");
const User = require("./userModel");

/**
 * function for creating res for login & signup
 * @param {Object} user
 * @param {Number} statusCode
 * @param {Function} res
 */
function createSendToken(user, statusCode, res) {
	// Create the token
	const token = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: process.env.TOKEN_EXPIRES,
	});

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

async function authorization(req, res, next) {
	try {
		// Get the JWT from the cookis
		const token = req.cookies.jwt;

		// Chack if it exists
		if (!token) {
			throw new Error("Need to be logged in for getting access!");
		}
		// Verify the token with the SECRET
		const data = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
		console.log(data);
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

async function login(req, res) {
	try {
		const { email, password } = req.body;
		// Check if email & password exist
		if (!email || !password) {
			throw new Error("Please provide email and password!");
		}
		// Find user with the password that stor in mongoDB
		const user = await User.findOne({ email }).select("+password");

		// Check if that email belong to any user & if the password matchs
		if (!user || !(await user.correctPassword(password, user.password))) {
			throw new Error("Incorrect email or password");
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

// Show something only to login users
function showSecret(req, res) {
	res.status(200).json({
		status: "success",
		message: `You know the secret! ${req.user.name}:)`,
	});
}

module.exports = {
	authorization,
	login,
	signup,
	showSecret,
};
