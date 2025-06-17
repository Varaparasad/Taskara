import express from 'express';
import cors from "cors"
import cookieParser from 'cookie-parser'
const app=express()
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 
const allowedOrigins = ['http://localhost:5173', 'https://taskara-1-9gnl.onrender.com'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(cookieParser())

//importing routes
import userRoute from './src/routes/user.route.js';
import projectRoute from './src/routes/project.route.js';
import ticketRoute from './src/routes/ticket.route.js'

app.use('/user', userRoute);
app.use('/project', projectRoute);
app.use('/ticket',ticketRoute)

export default app;

