import { asyncHandler } from "../utils/async_handler.js";
import jwt from "jsonwebtoken"
import { ApiError } from "../utils/apierror.js";
import { app } from "../app.js";
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/clouddinary.js"
import { ApiResponse } from "../utils/apiREsponse.js";
import {v2 as cloudinary} from "cloudinary";
import mongoose from "mongoose";




const genrateAccessAndRefreshTokens = async (userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.genrateAccessToken()
        const refreshToken = user.genrateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        // console.log(userId);
        

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, " Something went worng while generating refresh and access token")
    }
}
// console.log(genrateAccessAndRefreshTokens());
// 
const registerUser = asyncHandler( async (req,res)=> {
    
    //get user details from frontend
    // validation (example email is currect value empty to nhi h )
    // check is user already exists : username se or email se
    // check for images, check for avatar
    // upload them to cloudinary
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation 
    // return response
    // res.status(200).json({
    //     message : "ok"
    // })

    const {fullname, email, username, password} = req.body
    // console.log("email:", email)
    // console.log("password:",password);
    // console.log(req.body);
    if (
        [fullname,email,username,password].some((field)=>
        field?.trim() === "")
    ) {
        throw new ApiError(400, "all field are required")
    }

    const existedUser = User.findOne({
        $or: [{username:username},{email:email}]
    })

    // if (existedUser){
    //     throw new ApiError(409,"User with email or username already exists")
    // // }
    

    const avatorLocalPath = req.files?.avatar[0]?.path;
    // console.log(avatorLocalPath);
    // const coverImagePath = req.files?.coverImage[0]?.path;

    // classic method to check if cover image exists or not;
    let coverImagePath;
    if (req.files && Array.isArray(req.files.coverImage ) && req.files.coverImage.length > 0) {
        coverImagePath = req.files.coverImage[0].path

    }
    // console.log(req.files);

    if (!avatorLocalPath) {
        throw new ApiError(400,"Avatar file is required")

        
    }

    const avatar = await uploadOnCloudinary(avatorLocalPath)
    const coverImage = await uploadOnCloudinary(coverImagePath)
    // console.log(avatar);

    



    if (!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    const userCreated = await  User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!userCreated) {
        throw new ApiError (500,"Something went wrong while reg user")
        
    }

    return res.status(201).json(
        new ApiResponse(200,userCreated,"User registered successfully")
    )
} )




const loginUser = asyncHandler( async (req,res)=> {
    // this algoridum write by me
    // user name or email or password
    // validation check > like email or password match
    // if refresh token is match with user input then give him a access token 
    // attempts how many worng attempts he could do 

    // this algoridum i copied
    //req body -> se data lena h 1st
    //username or email kis se login karwana h 
    // user find karna h 
    // password check
    // access and refresh token send karne h agr user valid detail bhejta h to 
    // and isko secure cookies ke through send karna h 


    const {email, username, password} = req.body
    // console.log("username", username)
    if(!username && !email){
        throw new ApiError(400, "username or password is required")

    }

    const user = await User.findOne({
        $or: [{username:username},{email:email}]
        
    })
    // console.log(user);
    // print(req.email)
    // console.log(user);

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = await genrateAccessAndRefreshTokens(user._id)
    


    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }


    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiError(200, {}, "User logedout Successfully"))
})

const refreshAccessToken =  asyncHandler(async (req,res)=>{
    
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
        
    }
   try {
     const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
 
 
     const user = await User.findById(decodedToken?._id)
    //  console.log(user);
     
     if (!user) {
         throw new ApiError(401, "Invalid refresh token")
         
     }
 
     if (incomingRefreshToken !== user?.refreshToken) {
         throw new ApiError(401, "Refresh token is expired or used")
     }
 
     const options = {
         httpOnly: true,
         secure: true,
     }
 
     const { accessToken, newRefreshToken} = await genrateAccessAndRefreshTokens(user._id)
 
     return res
     .status(200)
     .cookie("accesstoken", accessToken, options)
     .cookie("refreshToken",newRefreshToken, options)
     .json(
         new ApiResponse(
             200,
             (accessToken, newRefreshToken),
             "Access token refreshed Successfully"
             
         )
     )
   } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
   }

})


const changeCurrentPassword = asyncHandler( async (req,res)=>{
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect =  await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")

    }

    user.password = newPassword
    await user.save({validateBeforeSave : false})

    return res.status(200)
    .json( new ApiResponse (200, "Password changed successfully"))

})
const getCurrentUser = asyncHandler( async (req,res)=> {
    return res.status(200)
    .json(new ApiResponse (200, req.user, "current user setched successfully"))
})

const UpdateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullname, email} = req.body

    if (!(fullname || email)) {
        throw new ApiError (200, "all fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse (200, user, "Account detiails updated successfully"))
})

const avatarCoverImage = asyncHandler( async(req,res)=>{
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError (400, "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    // console.log(avatar);
    
    if (!avatar.url) {
        throw new ApiError (400, "Error while uploading on avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
            avatar: avatar.url}
        },
        {new: true},

    ).select("-password")
    // console.log(req.avatar);
    

    const oldAvatar = user.avatar
    // console.log(oldAvatar);
    
    if (oldAvatar) {
        const oldAvatarId = oldAvatar.split("/").pop().split(".")[0];
        // console.log(oldAvatarId);
        
        cloudinary.uploader.destroy(oldAvatarId,(error,result)=>{
            if (error){
                console.error("Error deleting old avatar",error)
            } else{
                console.log("OldAvatar deleted successfully", result);
            }
        })
    }

    // cloudinary.uploader.destroy(avatar.url)

    return res.status(200)
    .json(
        new ApiResponse(200, "CoverImage updated Successfully")
    )
})

const updateUserCoverImage = asyncHandler( async(req,res)=>{
    const covetImageLocalPath = req.file?.path
    if (!covetImageLocalPath) {
        throw new ApiError (400, "CoverImage file is missing")
    }
    const coverImage = await uploadOnCloudinary(covetImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError (400, "Error while uploading on avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
            coverImage: coverImage.url}
        },
        {new: true},

    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200, "CoverImage updated Successfully")
    )
})


const getUserChannelProfile = asyncHandler( async (req,res)=> {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }
    const channel = await User.aggregate([{
        $match: {
            username: username?.toLowerCase()
        }
    },
    {
        $lookup: {
            from: "subscripitons",
            localField: "_id",
            foreignField: "channel",
            as : "subscribers"
        }
       
    },
     {
        $lookup:{
            from: "subscripitons",
            localField: "_id",
            foreignField: "subscriber",
            as : "subscribedTo"
        }
    },
    {
        $addFields: {
            subscribersCount: {
                $size: "$subscribers"
            },
            channelsSubscribedToCount: {
                $size: "$subscribedTo"
            },
            isSubscribed: {
                $cond: {
                    if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                    then: true,
                    else: false
                }
            }
        }
    },
    {
        $project: {
            fullname: 1,
            username: 1,
            subscribersCount: 1,
            channelsSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverimage: 1,
            email: 1
        }
    }

    ])
    if (!channel?.lenght) {
        throw new ApiError(404, "channel does not exists")
    }
    console.log(channel);
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "user channel fetched successfully")
    )

})


const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([{
        $match:{
            _id: new mongoose.Types.ObjectId(req.user._id)
        }
    },
    {
        $lookup:{
            from: "videos",
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline: [
                {
                    $lookup:{
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as : "owner",
                        pipeline:[
                            {
                                $project: {
                                    fullname: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields:{
                        owner:{
                            $first:"owner"
                        }
                    }
                }
            ]

        }
    }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "Watch history Fetched Successfully")
    )
})


export {registerUser,
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser,
    UpdateAccountDetails,
    avatarCoverImage,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}



