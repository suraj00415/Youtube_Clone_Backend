import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(morgan("combined"))
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended:true,limit: "16kb" }));
app.use(express.static("public"))
app.use(cookieParser())
app.use(errorHandler)
export { app };