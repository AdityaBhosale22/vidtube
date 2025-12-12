import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import { Apierrors } from "../utils/Apierrors.js";
import { Apiresponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    try {
        if(!channelId){
            throw new Apierrors(400, "Channel ID is required to toggle subscription")
        }
        const channel=await User.findById(channelId)
        if(!channel){
            throw new Apierrors(404, "Channel not found")
        }

        const existingSubscription=await Subscription.findOne({
            channel: channelId,
            subscriber: req.user._id,
        })
        if(existingSubscription){
            await Subscription.findByIdAndDelete(existingSubscription._id)
            return res
                .status(200)
                .json(new Apiresponse(200, null, "Unsubscribed from the channel successfully"))
        }
        const newSubscription=await Subscription.create({
            channel:channelId,
            subscriber:req.user._id,
        })
        if(!newSubscription){
            throw new Apierrors(500, "Error while subscribing to the channel")
        }
        return res
            .status(200)
            .json(new Apiresponse(200, newSubscription, "Subscribed to the channel successfully"))
    } catch (error) {
        throw new Apierrors(404, error?.message, "Failed to toggle subscription");
    }

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if (!channelId) {
        throw new Apierrors(400, "Channel ID is required")
    }

    const channel = await User.findById(channelId)
    if (!channel) {
        throw new Apierrors(404, "Channel does not exist in the database")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: channel._id
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails"
            }
        },
        {
            $unwind: "$subscriberDetails"
        },
        {
            $project: {
                _id: 0,
                subscriber: {
                    _id: "$subscriberDetails._id",
                    username: "$subscriberDetails.username",
                    avatar: "$subscriberDetails.avatar"
                }
            }
        }
    ])

    if (!subscribers) {
        throw new Apierrors(500, "Error while fetching subscribers for the channel")
    }

    return res
        .status(200)
        .json(
            new Apiresponse(
                200, 
                subscribers, 
                "Subscribers list for the channel fetched successfully"
            )
        )
})


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!subscriberId) {
        throw new Apierrors(400, "Subscriber ID is required")
    }
    const subscriber =await User.findById(subscriberId);
    if(!subscriber){
        throw new Apierrors(404, "Subscriber does not exist in the database")
    }
    const subscribedChannels = await Subscription.aggregate([
    {
        $match: {
            subscriber: subscriber._id
        }
    },
    {
        $lookup: {
            from: "users",
            localField: "channel",
            foreignField: "_id",
            as: "channelDetails"
        }
    },
    {
        $unwind: "$channelDetails"
    },
    {
        $project: {
            _id: 0,
            channel: {
                _id: "$channelDetails._id",
                username: "$channelDetails.username",
                fullName: "$channelDetails.fullName",
                avatar: "$channelDetails.avatar"
            }
        }
    }
])
    if (!subscribedChannels) {
        throw new Apierrors(500, "Error while fetching subscribed channels for the user")
    }
    return res
        .status(200)
        .json(
            new Apiresponse(
                200,
                subscribedChannels,
                "Subscribed channels fetched successfully"
            )
        )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}