import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ to: userId }).populate(
      "from",
      "username profileImg"
    );

    await Notification.updateMany({ to: userId }, { read: true });

    res.status(200).json(notifications);
  } catch (error) {
    console.log("Error in getNotification controller: " + error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.deleteMany({ to: userId });
    res.status(200).json({ message: "All notifications deleted" });
  } catch (error) {
    console.log("Error in deleteNotifications controller: " + error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification=await Notification.findById(notificationId);
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    if(notification.to.toString() !== notification){
        return res.status(403).json({ message: "Unauthorized: You are not allowed to delete this notification" });
    }

    await Notification.findByIdAndDelete(notificationId);
    res.json({ message: "Notification deleted" });


  } catch (error) {
    console.log("Error in deleteNotification controller: " + error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
