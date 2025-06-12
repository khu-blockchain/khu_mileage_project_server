const express = require("express");
const helmet = require("helmet");
const xss = require("xss-clean");
const httpStatus = require("http-status");
const cookieParser = require("cookie-parser");

const config = require("./config/config");
const morgan = require("./config/morgan");

const routes = require("./routes/v1");
const ApiError = require("./utils/ApiError");
const passport = require("passport");
const { jwtStrategy } = require("./config/passport");

const { errorConverter, errorHandler } = require("./utils/error");

const app = express();

const cors = require("cors");

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://khunggum.khu.ac.kr",
      "https://khunggum.khu.ac.kr",
    ],
    credentials: true,
    methods: ["*"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  })
);

app.get("/health", (req, res, next) => {
  res.send("success");
  res.end();
});

app.use(morgan.successHandler);
app.use(morgan.errorHandler);

app.use(helmet());

app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: false }));
app.use(xss());

app.use(passport.initialize());
passport.use("jwt", jwtStrategy);

app.use("/v1", routes);

app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, "Not Found"));
});

app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
