import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { Apierrors } from "../utils/Apierrors.js";
import { Apiresponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  try {
        const skippedVideos = (page-1)*limit
        const sortingVideo ={}
        if(sortBy && sortType){
            sortingVideo[sortBy]=sortType==='asc'? 1:-1
        }else{
            sortingVideo["createdAt"]=-1
        }
        if(!userId){
            throw new Apierrors(400, "User id is required to get all videos")
        }
        const videoList = await Video.aggregate([
            {
                $match:{
                    owner: userId,
                }
            },
            query && {
                $match:query
            },
            {
                $sort: sortingVideo
            },
            {
                $skip: skippedVideos,
            },
            {
                $limit: limit
            }
        ])
        if(!videoList || videoList.length()==0){
            throw new Apierrors(400, "Error while fetching all videos of the user")
        }
        return res
        .status(200)
        .json(
            new Apierrors(200, videoList, "All videos of the user is fetched successfully.")
        )
    } catch (error) {
        throw new Apierrors(500, error?.message);
    }

});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title?.trim()||!description?.trim()) {
    throw new Apierrors(400, "Title & description are required");
  }
  const videoFile = req.files?.video?.[0]?.path;
  const videoThumbnail=req.files?.thumbnail?.[0]?.path;
  if (!videoFile) {    
    throw new Apierrors(400, "Video file is required");
  }
  if (!videoThumbnail) {
    throw new Apierrors(400, "Thumbnail File is required");
  }
  const allowedVideoTypes = [
    "video/mp4",
    "video/avi",
    "video/mov",
    "video/mkv",
  ];
  if (!allowedVideoTypes.includes(videoFile.mimetype)) {
    throw new Apierrors(
      400,
      "Invalid video format. Allowed formats: mp4, avi, mov, mkv"
    );
  }

  let cloudinaryResponse;
    try {
      cloudinaryResponse = await uploadOnCloudinary(videoFile);
    } catch (error) {
      throw new Apierrors(500, "Failed to upload video to cloudinary");
    }
    if (!cloudinaryResponse?.secure_url || !cloudinaryResponse?.public_id) {
    throw new Apierrors(500, "Invalid response from Cloudinary");
  }

  let cloudinaryResponseThumbnail;
    try {
      cloudinaryResponseThumbnail = await uploadOnCloudinary(videoThumbnail);
    } catch (error) {
      throw new Apierrors(500, "Failed to upload video to cloudinary");
    }
    if (!cloudinaryResponseThumbnail?.secure_url || !cloudinaryResponseThumbnail?.public_id) {
    throw new Apierrors(500, "Invalid response from Cloudinary");
  }

  try {
    const newVideo = await Video.create({
      title: title.trim(),
      description: description.trim(),
      videoUrl: cloudinaryResponse.secure_url,
      videoPublicId: cloudinaryResponse.public_id,
      thumbnail:cloudinaryResponseThumbnail.url,
      uploadedBy: req.user._id,
    });
    return res
      .status(201)
      .json(new Apiresponse(201, "Video published successfully", newVideo));
  } catch (error) {
    throw new Apierrors(500, error?.message || "Failed to create video");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  try {
    if(!videoId){
      throw new Apierrors(400,"Invalid video id");
    }
    const video= await Video.findById(videoId).populate("uploadedBy","username email avatar");
    if(!video){
      throw new Apierrors(404,"Video not found");
    }
    return res
      .status(200)
      .json(new Apiresponse(200,"Video fetched successfully",video));
  } catch (error) {
    throw new Apierrors(500,error?.message || "Failed to fetch the video");
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
 try {
  const {newTitle, newDescription}=req.body;

   if(!videoId){
     throw new Apierrors(400,"Invalid video id");
   }
   if(!newTitle){
    throw new Apierrors(400,"Title is required");
   }
   const newThumbnail=req.file?.thumbnail[0].path;
   if(!newThumbnail){
    throw new Apierrors(400,"Thumbnail is required");
   }

   const updatedThumbnail=await uploadOnCloudinary(newThumbnail);
   if(!updatedThumbnail?.secure_url || !updatedThumbnail?.public_id){
    throw new Apierrors(500,"Failed to upload thumbnail to cloudinary");
   }

   const video= await Video.findById(videoId);
   if(!video){
    throw new Apierrors(404,"Video not found");
   }

   const updatedVideo= await Video.findByIdAndUpdate(
    videoId,
    {
      title:newTitle.trim(),
      description:newDescription.trim(),
      thumbnail:updatedThumbnail.secure_url,
    },
    {new:true}
   );
   if(!updatedVideo){
    throw new Apierrors(500,"Error while uploading the video");
   }
   return res
    .status(200)
    .json(new Apiresponse(200,"Video updated successfully",updatedVideo));

 } catch (error) {
  throw new Apierrors(404, error?.message);
 }


});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  try {
    if(!videoId){
      throw new Apierrors(400,"Invalid video id");
    }
    const video= await Video.findById(videoId);
    if(!video){
      throw new Apierrors(404,"Video not found");
    }
    const removeVideo=await Video.findByIdAndDelete(videoId);
    if(!removeVideo){
      throw new Apierrors(500,"Failed to delete the video");
    }
    return res
      .status(200)
      .json(new Apiresponse(200,"Video deleted successfully",null));
  } catch (error) {
    throw new Apierrors(500,error?.message || "Failed to delete the video");
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  try {
    if (!videoId) {
      throw new Apierrors(400, "Video id is required to toggle publish status");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new Apierrors(400, "Video does not exist with this id");
    }
    video.isPublished = !video.isPublished;
    await video.save();
    return res
      .status(200)
      .json(
        new Apiresponse(
          200,
          video,
          "Video publish status toggled successfully."
        )
      );
  } catch (error) {
    throw new Apierrors(404, error?.message);
  }
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
