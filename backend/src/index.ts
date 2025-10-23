import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import mongoose from "mongoose";
import { error } from "console";
import router from "./router";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
  })
);

app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

const server = http.createServer(app);

server.listen(8080, () => {
  console.log("Server running on http://localhost:8080/");
});

const MONGO_URL = process.env.MONGO_URL || "";

if (!MONGO_URL) {
  console.warn("WARNING: MONGO_URL not set in .env file. Database features will not work.");
} else {
  mongoose.Promise = Promise;
  mongoose.connect(MONGO_URL)
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => {
      console.warn("WARNING: Could not connect to MongoDB.");
      console.warn("Error:", error.message);
    });
  mongoose.connection.on("error", (error: Error) => console.log("MongoDB error:", error.message));
}

app.use("/", router());
