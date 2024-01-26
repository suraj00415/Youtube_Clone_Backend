import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path: "./.env",
});

connectDB()
    .then((res) => {
        app.listen(process.env.PORT || 8000, () => {
            console.log("Server Running on Port : " + process.env.PORT || 8000);
        });
    })
    .catch((error) => {
        console.log("Failed To Run Server " + error);
    });
app.get("/hi", (req, res) => {
    res.json({ mgs: "Hi" });
});
//Routes
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import subscriptionRouter from "./routes/subscritpion.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
