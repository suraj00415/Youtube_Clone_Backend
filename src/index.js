import mongoose from "mongoose";
import express from "express";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({
  path:"./env"
})

const app = express();

connectDB().then((res)=>{
  if(res.connection){
    app.listen(process.env.PORT || 8000,()=>{
      console.log("Server Running on Port : "+ process.env.PORT || 8000)
    })
  }
}
).catch((error)=>{
  console.log("MongoDb Connection Failed"+error)
});
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
