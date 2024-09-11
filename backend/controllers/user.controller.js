import { v2 as cloudinary } from "cloudinary";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.log("Error in getUserProfile controller: " + error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToModify = await User.findById(id).select("-password");
    const currentUser = await User.findById(req.user._id);

    // check if users are found
    if (!userToModify || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // current user can't follow himself
    if (currentUser._id.toString() === id) {
      return res
        .status(403)
        .json({ error: "You can't follow/unfollow yourself" });
    }

    const isFollowing = currentUser.following.includes(id);
    if (isFollowing) {
      // unfollow
      await User.findByIdAndUpdate(currentUser._id, {
        $pull: { following: id },
      });
      await User.findByIdAndUpdate(id, {
        $pull: { followers: currentUser._id },
      });

      // send notification
      const newNotification = new Notification({
        type: "follow",
        from: req.user._id,
        to: userToModify._id,
      });

      await newNotification.save();

      res.status(200).json({ message: "User unfollowed successfully" });
    } else {
      // follow
      await User.findByIdAndUpdate(currentUser._id, {
        $push: { following: id },
      });
      await User.findByIdAndUpdate(id, {
        $push: { followers: currentUser._id },
      });
      // send notification
      const newNotification = new Notification({
        type: "follow",
        from: req.user._id,
        to: userToModify._id,
      });
      await newNotification.save();
      res.status(200).json({ message: "User followed successfully" });
    }
  } catch (error) {
    console.log("Error in followUnfollow controller: " + error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const usersFollowedByMe = await User.findById(userId).select("following");

    // get some users
    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
        },
      },

      {
        $sample: { size: 10 },
      },
    ]);

    // filter out users I already follow
    const filteredUsers = users.filter(
      (user) => !usersFollowedByMe.following.includes(user._id)
    );
    const suggestedUsers = filteredUsers.slice(0, 4);
    suggestedUsers.forEach((user) => (user.password = null));

    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log("Error in getSuggestedUsers controller: " + error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateUserProfile = async (req, res) => {
  const { fullName, email, username, currentPassword, newPassword, bio, link } =
    req.body;
  let { profileImg, coverImg } = req.body;

  const userId = req.user._id;

  try {
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // password validation
    if (
      (currentPassword && !newPassword) ||
      (!currentPassword && newPassword)
    ) {
      return res.status(404).json({
        error: "Please provide both current password and new password",
      });
    }

    if (newPassword && currentPassword) {
      const isMatch = await bcrypt.compare(
        currentPassword,
        user?.password || ""
      );
      if (isMatch) {
        if (newPassword.length >= 6) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(newPassword, salt);
          user.password = hashedPassword;
        } else {
          return res
            .status(404)
            .json({ error: "Password must be at least 6 characters long" });
        }
      }
      else{
        return res.status(404).json({ error: "Invalid current password" });
      }
    }

    // upload images to cloudinary TODO: upload to db
    if (profileImg) {
      if (user.profileImg) {
        // https://res.cloudinary.com/codelife/image/upload/v1621712847/octocat.png
        await cloudinary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );
      }
      const uploadedResponse = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadedResponse.secure_url;
    }

    if (coverImg) {
      if (user.coverImg) {
        await cloudinary.uploader.destroy(
          user.coverImg.split("/").pop().split(".")[0]
        );
      }
      const uploadedResponse = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadedResponse.secure_url;
    }

    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || profileImg;
    user.coverImg = coverImg || coverImg;

    user = await user.save();
    user.password = null;
    return res.status(200).json(user);
  } catch (error) {
    console.log("Error in updateUserProfile controller: " + error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
