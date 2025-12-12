import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Apierrors } from "../utils/Apierrors.js";
import { Apiresponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  try {
    if (!videoId) {
      throw new ApiError(400, "Video ID is required");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new Apierrors(404, "Video not found");
    }

    const existingLike = await findone({ video: videoId, user: req.user?._id });
    if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id);
      return res
        .status(200)
        .json(new Apiresponse(200, null, "Like removed from the video"));
    }
    const newLike = await Like.create({
      video: videoId,
      user: req.user?._id,
    });
    if (!likeVideo) {
      throw new Apierrors(400, "Error while liking the video");
    }
    return res
      .status(200)
      .json(new Apiresponse(200, likeVideo, "Liked the video successfully."));
  } catch (error) {
    throw new Apierrors(404, error?.message);
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  try {
    if (!commentId) {
      throw new Apierrors(400, "Comment ID is required");
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new Apierrors(404, "Comment not found");
    }
    const existingLike = await Like.findone({
      comment: commentId,
      user: req.user?._id,
    });
    if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id);
      return res
        .status(200)
        .json(new Apiresponse(200, null, "Like removed from the video"));
    }

    const newLike = await Like.create({
      comment: commentId,
      user: req.user?._id,
    });
    if (!newLike) {
      throw new Apierrors(400, "Error while liking the comment");
    }
    return res
      .status(200)
      .json(new Apiresponse(200, newLike, "Liked the comment successfully."));
  } catch (error) {
    throw new Apierrors(404, error?.message);
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  try {
    if (!tweetId) {
      throw new Apierrors(400, "Tweet id is required");
    }
    
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      throw new Apierrors(400, "Tweet does not exist in the database");
    }
    
    const alreadyLikedTweet = await Like.findOne({
      tweet: tweetId,
      likedBy: req.user?._id,
    });
   

    if (alreadyLikedTweet) {
      await Like.findByIdAndDelete(tweetId, { new: true });
      return res
        .status(200)
        .json(new Apiresponse(200, {}, "Successfully unliked the tweet"));
    }
    const likeTweet = await Like.create({
      tweet: tweetId,
      likedBy: req.user?._id,
    });
    if (!likeTweet) {
      throw new Apierrors(400, "Error while liking the tweet");
    }
    return res
      .status(200)
      .json(new Apiresponse(200, likeTweet, "Successfully liked the tweet."));
  } catch (error) {
    throw new Apierrors(404, error?.message);
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  try {
    const likedVideos = await Like.aggregate([
      {
        $match: {
          likeBy: new mongoose.Types.ObjectId(req.user?._id),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "likedvideos",
        },
      },
      {
        $unwind: "$likedvideos",
      },
      {
        $project: {
          likedVideos: 1,
        },
      },
    ]);
    if (!likedVideos) {
      return res
        .status(200)
        .json(new Apiresponse(200, {}, "User have not liked any video yet."));
    }
    return res
      .status(200)
      .json(
        new Apiresponse(
          200,
          likedVideos,
          "Successfully fetched user liked videos."
        )
      );
  } catch (error) {
    throw new Apierrors(404, error?.message);
  }
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
