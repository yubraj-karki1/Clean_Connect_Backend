import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { PORT } from './config';
import cors from 'cors';
import path from 'path';
dotenv.config();
import authroutes from './routes/auth.route';
import { connectDB } from './database/mongodb';
import adminUserRoute from './routes/admin/user.route';
import bookingRoute from "./routes/booking.route";

const app: Application = express();

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3003", "http://localhost:3005"],
  credentials: true,
}));

app.use(bodyParser.json());
app.use("/api/bookings", bookingRoute);
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req: Request, res: Response) => {
  return res.status(200).json({ success: true, message: "Welcome to the API" });
});

// Routes
app.use('/api/auth', authroutes);
app.use('/api/users', adminUserRoute);
app.use('/api/admin/users', adminUserRoute);



if (process.env.NODE_ENV !== 'test') {
  async function startServer() {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server on http://localhost:${PORT}`);
    });
  }
  startServer();
}

export default app;
