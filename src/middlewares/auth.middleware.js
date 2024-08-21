import { asyncHandler } from "../utils/async_handler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apierror.js";

 export const verifyJWT = asyncHandler (async (req, res, next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        // console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorizad request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
    
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )
    
        if (!user) {
            // TODO: discuess about frontend in next video
            throw new ApiError (401, "Invalid Acees Token")
        }
        req.user = user;
    
        next()
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token")
        
    }
 })