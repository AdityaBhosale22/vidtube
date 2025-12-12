import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {Apiresponse, ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Apierrors } from "../utils/Apierrors.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if(!videoId){
        throw new Apierrors(400, "Video ID is required")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new Apierrors(404, "Video is not present in the database.")
    }

    const skip = (page - 1) * limit;

    const allComments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: {
                    _id: "$owner._id",
                    username: "$owner.username",
                    fullName: "$owner.fullName",
                    avatar: "$owner.avatar",
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $skip: skip
        },
        {
            $limit: limit
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, allComments, "All comments for video fetched successfully")
    )
})


const addComment = asyncHandler(async (req, res) => {
    const {videoId}=req.params;
    const {content}=req.body;
    try {
        if(!videoId){
            throw new Apierrors(404, "Video ID is required to add a comment")
        }
        if(!content?.trim()){
            throw new Apierrors(404, "Content is required to add a comment")
        }
        const newComment = await Comment.create({
            content:content,
            videoId:videoId,
            commentedBy:req.user._id,
        })
        if(!newComment){
            throw new Apierrors(404, "Error while adding comment")
        }
        return res
            .status(200)
            .json(new Apiresponse(200, newComment, "Comment added successfully"))

    } catch (error) {
       throw new Apierrors(404, "Error while adding comment", error?.message) 
    }
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId}=req.params;
    const {updatedContent}=req.body;
    try {
        if(!commentId){
            throw new Apierrors(404, "Commet ID is required to update a comment")
        }
        if(!updatedContent?.trim()){
            throw new Apierrors(400, "Updated comment content is required")
        }
        const comment = await Comment.findById(commentId);
        if(!comment){
            throw new Apierrors(404, "Comment not found")
        }
        const updatedContent= await Comment.findByIdAndUpdate(
            commentId,
            {
                content: updatedContent,
            },
            {new:true}
        );
        if(!updatedContent){
            throw new Apierrors(404, "Failed to update the comment content")
        }
        return res
            .status(200)
            .json(new Apiresponse(200, updatedContent, "Comment content updated successfully"));
    } catch (error) {
        throw new Apierrors(404, "Error while updating the comment content", error?.message)
    }

})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId}=req.params;
    try {
        if(!commentId){
            throw new Apierrors(404, "Comment ID is required to delete a comment")
        }
        const comment = await Comment.findById(commentId);
        if(!comment){
            throw new Apierrors(404, "Comment not found")
        }
    
        const deleteComment=await Comment.findByIdAndDelete(commentId);
        if(!deleteComment){
            throw new Apierrors(404, "Failed to delete the comment")
        }
        return res
            .status(200)
            .json(new Apiresponse(200, null, "Comment deleted successfully"));
    } catch (error) {
        throw new Apierrors(500, error?.message, "Error while deleting the comment")
    }
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }