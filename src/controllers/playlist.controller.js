import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import { Apierrors } from "../utils/Apierrors.js";
import { Apiresponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    try {
        if(!name?.trim()){
            throw new Apierrors(400, "Playlist name is required to create playlist")
        }
        const newPlaylist = await Playlist.create({
            name,
            description: description || "",
            owner: req.user?._id,
            video:[]
        })
        if(!newPlaylist){
            throw new Apierrors(400, "Error while creating playlist.")
        }
        return res
        .status(200)
        .json(
            new Apiresponse(200, "Playlist created successfully", newPlaylist)
        )
    } catch (error) {
        throw new Apierrors(500, "Error while creating playlist", error?.message)
    }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user?._id; 

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const userExist = await User.findById(userId);
    if (!userExist) {
        throw new ApiError(404, "User does not exist");
    }

    const ownerId = new mongoose.Types.ObjectId(userId);

    const userAllPlaylists = await Playlist.aggregate([
        {
            $match: {
                owner: ownerId
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $unwind: {
                path: "$videos",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $match: {
                $or: [
                    { owner: currentUserId },
                    { "videos.isPublished": true },
                    { videos: { $eq: null } }
                ]
            }
        },
        {
            $group: {
                _id: "$_id",
                name: { $first: "$name" },
                description: { $first: "$description" },
                owner: { $first: "$owner" },
                createdAt: { $first: "$createdAt" },
                updatedAt: { $first: "$updatedAt" },
                videos: { $push: "$videos" }, 
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1,
                videoCount: { $size: "$videos" },
                videos: {
                    $filter: {
                        input: "$videos",
                        as: "video",
                        cond: { $ne: ["$$video", null] }
                    }
                }
            }
        }
    ]);

    if (userAllPlaylists.length === 0) {
        return res
            .status(200)
            .json(
                new ApiResponse(200, [], "User does not have any playlists.")
            );
    }
    
    return res
        .status(200)
        .json(
            new ApiResponse(200, userAllPlaylists, "User all playlists fetched successfully.")
        );
});


const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!playlistId){
        throw new Apierrors(400, "Playlist ID is required to get playlist by ID")
    }
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new Apierrors(404, "Playlist not found")
    }
    return res
    .status(200)
    .json(
        new Apiresponse(
            200,
            playlist,
            "Playlist fetched successfully"
        )
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId || !videoId){
        throw new Apierrors(400, "Playlist ID and Video ID are required to remove video from playlist")
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId,
            },
        },
        {
            new: true,

        }
    )
    if(!updatePlaylist){
        throw new Apierrors(404, "Playlist not found")
    }
    return res
    .status(200)
    .json(
        new Apiresponse(
            200,
            updatedPlaylist,
            "Video added to playlist successfully"
        )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId || !videoId) {
    throw new Apierrors(
      400,
      "Playlist ID and Video ID are required to remove video from playlist"
    );
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylist) {
    throw new Apierrors(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(
      new Apiresponse(
        200,
        updatedPlaylist,
        "Video removed from playlist successfully"
      )
    );
});


const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    try {
        if(!playlistId){
            throw new Apierrors(404, "Playlist ID is required to delete playlist")
        }
        const playlist = await Playlist.findById(playlistId);
        if(!playlist){
            throw new Apierrors(404, "Playlist not found")
        }
        const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
        if(!deletedPlaylist){
            throw new Apierrors(500, "Failed to delete playlist")
        }
        return res
            .status(200)
            .json(new Apiresponse(200, "Playlist deleted successfully", null));
    } catch (error) {
        throw new Apierrors(500, "Error while deleting playlist", error?.message)
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    try {
        if(!playlistId){
            throw new Apierrors(400, "Playlist ID is required to update playlist")
        }
        if(!name?.trim()&&!description?.trim()){
            throw new Apierrors(400, "Atleast one field is required to update playlist")
        }
        const playlist = await Playlist.findById(playlistId);
        if(!playlist){
            throw new Apierrors(404, "Playlist not found")
        }
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            { _id: playlistId},
            {
                $set:{
                    name,
                    description
                }
            },
            {new: true}
        );
        if(!updatedPlaylist){
            throw new Apierrors(500, "Failed to update playlist")
        }
    } catch (error) {
        throw new Apierrors(500, "Error while updating playlist")
    }
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}