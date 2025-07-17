// backend/app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";

const app = express();

app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(compression());

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.use("/api", (req, res) => {
  res.send("Hello World!");
});

export default app;
