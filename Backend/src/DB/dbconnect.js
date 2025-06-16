import mongoose from 'mongoose'
const dbconnect=async () => {
    try {
        const connection=await mongoose.connect(`${process.env.mongoURI}/BugTracker`)
        console.log({
            "message": "MongoDB connected successfully",
            "connectedAt": connection.connection.host
        });
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
}
export default dbconnect

