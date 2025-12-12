import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { Apierrors } from "../utils/Apierrors.js";
import { Apiresponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new Apierrors(401, "Unauthorized access. Please log in.");
  }

  const channelId = new mongoose.Types.ObjectId(req.user._id);

  const stats = await Video.aggregate([
    {
      $match: {
        owner: channelId,
        isPublished: true,
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $group: {
        _id: null,
        totalVideoCount: { $sum: 1 },
        totalVideoViews: { $sum: "$views" },
        totalLikes: { $sum: { $size: "$likes" } },
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        pipeline: [
          { $match: { channel: channelId } },
          { $count: "totalSubscribers" },
        ],
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "tweets",
        localField: "_id",
        foreignField: "owner",
        pipeline: [{ $match: { owner: channelId } }, { $count: "totalTweets" }],
        as: "tweets",
      },
    },
    {
      $project: {
        _id: 0,
        totalVideoCount: 1,
        totalVideoViews: 1,
        totalLikes: 1,
        totalSubscribers: {
          $arrayElemAt: ["$subscribers.totalSubscribers", 0],
        },
        totalTweets: { $arrayElemAt: ["$tweets.totalTweets", 0] },
      },
    },
  ]);

  const finalStats = stats[0] || {
    totalVideoCount: 0,
    totalVideoViews: 0,
    totalLikes: 0,
    totalSubscribers: 0,
    totalTweets: 0,
  };

  return res
    .status(200)
    .json(
      new Apiresponse(200, finalStats, "Channel stats fetched successfully")
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new Apierrors(401, "Unauthorized access. Please log in.");
  }

  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;

  const pipeline = [
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        as: "comments",
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        thumbnail: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
        duration: 1,
        totalLikes: { $size: "$likes" },
        totalComments: { $size: "$comments" },
      },
    },
    {
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    },
  ];

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const videoData = await Video.aggregatePaginate(
    Video.aggregate(pipeline),
    options
  );

  return res
    .status(200)
    .json(
      new Apiresponse(200, videoData, "Channel videos fetched successfully")
    );
});

export { getChannelStats, getChannelVideos };