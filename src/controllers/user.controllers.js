import { asyncHandler } from "../utils/asyncHandler.js";
import { Apierrors } from "../utils/Apierrors.js";
import { User } from "../models/user.models.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { Apiresponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessandRefreshToken = async (userId) => {
  try {
    const user = User.findById(userId);
    if (!user) {
      throw new Apierrors(404, "User not found");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new Apierrors(500, "Error in generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body;

  if (
    [fullname, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new Apierrors(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new Apierrors(
      409,
      "User with given email or username already exists"
    );
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new Apierrors(400, "Avatar file is missing");
  }

  let avatar;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    // console.log("Uploaded avtar on cloudinary", avatar);
  } catch (error) {
    throw new Apierrors(500, "Failed to upload avatar image");
  }

  let coverImage;
  if (coverImageLocalPath) {
    // Only try to upload if path exists
    try {
      coverImage = await uploadOnCloudinary(coverImageLocalPath);
      // console.log("Uploaded coverImage on cloudinary", coverImage);
    } catch (error) {
      throw new Apierrors(500, "Failed to upload CoverImage");
    }
  }

  try {
    const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "", // Safely access url
      username: username.toLowerCase(),
      email,
      password,
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new Apierrors(500, "Something went wrong while creating user");
    }

    return res
      .status(201)
      .json(new Apiresponse(201, createdUser, "User registered successfully"));
  } catch (error) {
    console.log("User creation failed, cleaning up images...", error);

    // Cleanup if DB entry fails
    if (avatar?.public_id) {
      await deleteFromCloudinary(avatar.public_id);
    }
    if (coverImage?.public_id) {
      await deleteFromCloudinary(coverImage.public_id);
    }

    throw new Apierrors(500, "Something went wrong while creating user");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!username && !email) {
    throw new Apierrors(400, "Username or Email is required");
  }
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (!user) {
    throw new Apierrors(404, "User not found");
  }

  //validate password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new Apierrors(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await user.generateAccessToken();

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new Apiresponse(200, loggedInUser, "User logged in successfully"));
});

const logoutUser= asyncHandler(async (req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {new:true}
    )
    const options={
        httpOnly:true,
        secure:process.env.NODE_ENV==="production",
    }
    return res
     .status(200)
     .clearCookie("accessToken",options)
     .clearCookie("refreshToken",options)
     .json(new Apiresponse(200, null, "User logged out successfully"));
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new Apierrors(401, "Refresh token is missing");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user || incomingRefreshToken !== user?.refreshToken) {
      throw new Apierrors(403, "Invalid refresh token");
    }
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessandRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new Apiresponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new Apierrors(500, "Something went wrong while refreshing token");
  }
});

const changeCurrentPassowrd = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword}=req.body;
    const user = await User.findById(req.user._id);
    const isPasswordValid= await user.isPasswordCorrect(oldPassword);
    if(!isPasswordValid){
        throw new Apierrors(401, "Old password is incorrect");
    }
    user.password=newPassword;

    await user.save({ validateBeforeSave: true });
    return res
    .status(200)
    .json(new Apiresponse(200, null, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(new Apiresponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullname, username, email}=req.body;
    if(!fullname || !username || !email){
        throw new Apierrors(400, "All fields are required");
    }
    const updatedUser= await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                fullname,
                username:username.toLowerCase(),
                email
            }
        },
        {new:true}
    ).select("-password -refreshToken");
    return res
    .status(200)
    .json(new Apiresponse(200, updatedUser, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath= req.file?.path;
    if(!avatarLocalPath){
        throw new Apierrors(400, "Avatar file is missing");
    }
    const avatar= await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new Apierrors(500, "Failed to upload avatar image");
    }
    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password -refreshToken");
    return res
    .status(200)
    .json(new Apiresponse(200, user, "User avatar updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath= req.file?.path;
    if(!coverImageLocalPath){
        throw new Apierrors(400, "Cover image file is missing");
    }
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new Apierrors(500, "Failed to upload cover image");
    }
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password -refreshToken");
    return res
    .status(200)
    .json(new Apiresponse(200, null, "User cover image updated successfully")
    )
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new Apierrors(400, "Username is required");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase().trim(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        channelSubscribedToCount: { $size: "$subscribedTo" },
      },
    },
    {
      isSubscribed: {
        $in: [req.user._id, "$subscribers.subscriber"],
        then: true,
        else: false,
      },
    },
    {
      $project:{
        fullname:1,
        username:1,
        email:1,
        avatar:1,
        coverImage:1,
        subscribersCount:1,
        channelSubscribedToCount:1,
        isSubscribed:1
      }
    }
  ]);
  if(!channel?.length){
    throw new Apierrors(404, "Channel not found");
  }
  return res
    .status(200)
    .json(new Apiresponse(200, channel[0], "Channel profile fetched successfully"));
});

const getWatchHistory =asyncHandler(async(req,res)=>{
  const user= await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user?._id)
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistoryVideos",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullname:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
    }
  ])
  return res
  .status(200)
  .json(new Apiresponse(200, user[0]?.watchHistoryVideos || [], "User watch history fetched successfully"));
})

export { registerUser, refreshAccessToken, loginUser, logoutUser, changeCurrentPassowrd, getCurrentUser, updateAccountDetails, updateUserAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory };
