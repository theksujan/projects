import express from 'express';
import dotenv from 'dotenv';
dotenv.config()
import cookieParser from 'cookie-parser';
import {v2 as cloudinary} from 'cloudinary';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import postRoutes from './routes/post.route.js';
import notificationRoutes from './routes/notification.route.js';



import connectMongoDB from './db/connectMongoDB.js';

const app = express();
const PORT=process.env.PORT || 5000

// middleware
app.use(express.json({ limit: '10mb' }));  // parse request body 
app.use(express.urlencoded({ limit: '10mb', extended: true })); // parse form body
app.use(cookieParser()); 

// Routes
app.use('/api/auth',authRoutes)
app.use('/api/users',userRoutes)
app.use('/api/posts',postRoutes)
app.use('/api/notifications',notificationRoutes)

if(process.env.NODE_ENV === 'production'){
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
}

app.get("*",(req,res)=>{
    res.sendFile(path.resolve(__dirname,".." ,"frontend","dist","index.html"));
})



app.listen(PORT,() => {
    console.log(`Server is running on port ${PORT}`);
    connectMongoDB();
})