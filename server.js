require("dotenv").config({ path: ".env" });
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const routesHandler = require("./routesHandler");
// create the app
const app = express();

// global midlleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());

// Connecting to MongoDB
mongoose.connect("mongodb://localhost:27017/JWT_HW").then(() => {
	console.log("MongoDB connected successfuly!");
});

// the route that i am using
app.post("/signup", routesHandler.signup);
app.post("/login", routesHandler.login);
app.get("/secret", routesHandler.authorization, routesHandler.showSecret);

app.listen(2020, () => {
	console.log(`App running on port: 127.0.0.1:${2020}...`);
});
