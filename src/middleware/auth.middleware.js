import jwt from "jsonwebtoken";
import { Apierrors } from "../utils/Apierrors.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.models.js";

export const verifyJWT = asyncHandler(async (req, res, next)=>{
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ","");
    if(!token){
        throw new Apierrors(401, "Access token is missing");
    }
    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user=await User.findById(decodedToken._id).select("-password -refreshToken") 
        if(!user){
            throw new Apierrors(401, "User not found");
        }
        req.user=user;
        next();
    } catch (error) {
        throw new Apierrors(401, error?.message || "Invalid or expired access token");
    }
})