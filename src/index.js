import mongoose from "mongoose";
import express from "express";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({
  path:"./env"
})

const app = express();
connectDB();
// ;(async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}`);
//     app.on("error", (error) => {
//       console.log("ERROR:", error);
//       throw error;
//     });
//     app.listen(process.env.PORT, () => {
//       console.log("App is listening on Port:" + process.env.PORT);
//     });
//   } catch (error) {
//     console.error("ERROR:", error);
//     throw error;
//   }
// })();
