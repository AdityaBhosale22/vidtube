import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import { User } from "../models/user.models.js";
import { Apierrors } from "../utils/Apierrors.js";
import { Apiresponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    const {content}=req.body;
    try {
        if(!content?.trim()){
            throw new Apierrors(400, "Tweet content is required");
        }
        const newTweet = await Tweet.create({
            content: content,
            owner: req.user._id
        });
        if(!newTweet){
            throw new Apierrors(500, "Error while creating tweet")
        }
        return res
            .status(200)
            .json(new Apiresponse(200, newTweet, "Tweet created successfully"));
    } catch (error) {
        throw new Apierrors(400, error?.message)
    }

})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    try {
      if (!userId || !isValidObjectId(userId)) {
        throw new Apierrors(400, "Valid user ID is required");
      }
      const tweets = await Tweet.find({ owner: userId })
        .sort({ createdAt: -1 })
        .select("content createdAt likesCount mediaUrl");
      return res
        .status(200)
        .json(new Apiresponse(200, tweets, "User tweets fetched successfully"));
    } catch (error) {
      throw new Apierrors(500, error?.message);
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}