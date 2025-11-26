import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDB from "./Conig/mongodb.js";
import authRouter from "../Server/routes/authRoutes.js";

const app = express();
const Port = process.env.Port || 4000;
connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true }));
//API Endpoints
app.get("/", (req, res) => {
  res.send("API is working successully");
});
app.use("/api/auth", authRouter);

app.listen(Port, () => {
  console.log(`Server has started on port ${Port}`);
});
