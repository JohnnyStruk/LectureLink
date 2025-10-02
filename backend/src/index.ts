import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import mongoose from "mongoose";
import { error } from "console";
// import router from "./router";

const app = express();

app.use(
  cors({
    credentials: true,
  })
);

app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

const server = http.createServer(app);

server.listen(8080, () => {
  console.log("Server running on http://localhost:8080/");
});

const MONGO_URL =
  "mongodb+srv://LectureLink:NFObztGIkojvJWGu@lecturelink.u7wlmmo.mongodb.net/?retryWrites=true&w=majority&appName=LectureLink";

mongoose.Promise = Promise;
mongoose.connect(MONGO_URL);
mongoose.connection.on("error", (error: Error) => console.log(error));

// app.use("/", router());

// NFObztGIkojvJWGu LectureLink Password
// avncZU73XX0rr6j9 JohnStruckman Password
