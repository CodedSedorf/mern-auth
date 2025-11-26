import mongoose from "mongoose";

const connectDB = async () => {
  //getting message for connection
  mongoose.connection.on("connected", () => {
    console.log("Database Connected");
  });
  //This comes before the message. Tis is the connection settings
  await mongoose.connect(`${process.env.MONGODB_URI}/authentication-tutorial`);
};

export default connectDB;
