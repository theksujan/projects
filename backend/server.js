import express from 'express';
import dotenv from 'dotenv';
dotenv.config()
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes.js';
import connectMongoDB from './db/connectMongoDB.js';


const app = express();
const PORT=process.env.PORT || 5000

// middleware
app.use(express.json()); // to parse req.body
app.use(express.urlencoded({ extended:true})) // parse form data
app.use(cookieParser()); 


app.use('/api/auth',authRoutes)




app.listen(PORT,() => {
    console.log(`Server is running on port ${PORT}`);
    connectMongoDB();
})