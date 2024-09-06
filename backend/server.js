import express from 'express';
import dotenv from 'dotenv';
dotenv.config()
import cookieParser from 'cookie-parser';
import {v2 as cloudinary} from 'cloudinary';

// cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

import connectMongoDB from './db/connectMongoDB.js';

const app = express();
const PORT=process.env.PORT || 5000

// middleware
app.use(express.json()); // to parse req.body
app.use(express.urlencoded({ extended:true})) // parse form data
app.use(cookieParser()); 

// Routes
app.use('/api/auth',authRoutes)
app.use('/api/users',userRoutes)




app.listen(PORT,() => {
    console.log(`Server is running on port ${PORT}`);
    connectMongoDB();
})