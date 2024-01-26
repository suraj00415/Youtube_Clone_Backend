import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            process.env.MONGODB_URI
        );
        console.log(
            "MongoDB Connected || DB_HOST: " +
                connectionInstance.connection.host
        );
    } catch (error) {
        console.log("MongoDb Connection Failed:", error);
        process.exit(1);
    }
};

export default connectDB;