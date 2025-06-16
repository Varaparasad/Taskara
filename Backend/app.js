import express from 'express';
import cors from "cors"
import cookieParser from 'cookie-parser'
const app=express()
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyJWT } from './src/middlewares/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 
app.use(cors({
  origin: 'http://localhost:5173', // your frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true // allow cookies or authorization headers if used
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN,  // your frontend URL
  credentials: true                // allow cookies to be sent
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

