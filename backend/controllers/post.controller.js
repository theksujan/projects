import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
Notification
import { v2 as cloudinary } from "cloudinary";

export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { img } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!text && !img)
      return res.status(400).json({ message: "Post must have text or image" });

    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    const newPost = new Post({
      user: userId,
      text,
      img,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.log("Error in createPost controller: " + error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          message: "Unauthorized: You are not allowed to delete this post",
        });
    }

    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("Error in deletePost controller: " + error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const commentOnPost = async (req, res) => {
    try {
        
        const {text}=req.body;
        const postId=req.params.id;
        const userId=req.user._id;
        
        if(!text){
            return res.status(400).json({ message: "Text field is required" });
        }
         
        const post=await Post.findById(req.params.id);
        if(!post) return res.status(404).json({ message: "Post not found" });

        const comment={
            user: userId,
            text
        }

        post.comments.push(comment);
        await post.save();

        res.status(200).json(post);


    } catch (error) {
        console.log("Error in commentOnPost controller: " + error);
        return res.status(500).json({ error: "Internal Server Error" });
    }

}

export const likeUnlikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    // Get target post
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Get user document
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Initialize likedPosts if it doesn't exist
    if (!user.likedPosts) {
      user.likedPosts = [];
      await user.save();
    }

    // Check if user has already liked the post
    const isLiked = post.likes.includes(userId);
    if (isLiked) {
      // Unlike post
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });
      const updatedLikes=post.likes.filter((id)=>id.toString()!==userId);
      res.status(200).json(updatedLikes);

    } else {
      // Like post
      await Promise.all([
        User.updateOne({ _id: userId }, { $push: { likedPosts: postId } }),
        Post.updateOne({ _id: postId }, { $push: { likes: userId } })
      ]);

      const updatedLikes=post.likes

      // Create a notification
      const notification = new Notification({
        type: "like",
        from: userId,
        to: postId,
      });
      await notification.save();
      
      res.status(200).json(updatedLikes);
    }
  } catch (error) {
    console.log("Error in likeUnlikePost controller: " + error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


export const getAllPosts = async(req, res) =>{
  try {
    const posts=await Post.find().sort({createdAt:-1}).populate("user","-password").populate("comments.user","-password");
    res.status(200).json(posts);  

    if(posts.length===0){
      return res.status(200).json({ message: "No posts found"});  
    }
    
  } catch (error) {
    console.log("Error in getAllPosts controller: " + error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}


export const getLikedPosts=async(req,res)=>{
  try {
    const userId=req.params.id
    const user=await User.findById(userId);
    if(!user) return res.status(404).json({ message: "User not found" });
    
    
    const likedPosts=await Post.find({_id:{$in:user.likedPosts}}).populate("user","-password").populate("comments.user","-password");
    res.status(200).json(likedPosts);

  } catch (error) {
    console.log("Error in getLikedPosts controller: " + error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}


export const getFollowingPosts=async(req,res)=>{
  try {
    
    const userId=req.user._id;
    // get users whom current user is following
    const user=await User.findById(userId);
    if(!user) return res.status(404).json({ message: "User not found" });


    const followingUsers=user.following;
    const followingPosts=await Post.find({user:{$in:followingUsers}}).sort({createdAt:-1}).populate("user","-password").populate("comments.user","-password");
    res.status(200).json(followingPosts);
    
   

  } catch (error) {
    console.log("Error in getFollowingPosts controller: " + error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export const getUserPosts=async(req,res)=>{
  try {
    
    const {username}=req.params;
    const user=await User.findOne({username})
    if(!user) return res.status(404).json({ message: "User not found" });

    const posts=await Post.find({user:user._id})
    .sort({createdAt:-1})
    .populate("user","-password")
    .populate("comments.user","-password");

    res.status(200).json(posts);

    if(posts.length===0){
      return res.status(200).json({ message: "No posts found for this user"});  
    }

  } catch (error) {
    console.log("Error in getUserPosts controller: " + error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}