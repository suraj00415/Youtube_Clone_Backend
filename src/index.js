import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
  path:"./env"
})

connectDB().then((res)=>{
    app.listen(process.env.PORT || 8000,()=>{
      console.log("Server Running on Port : "+ process.env.PORT || 8000)
    })
  }
).catch((error)=>{
  console.log("Failed To Run Server "+error)
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
