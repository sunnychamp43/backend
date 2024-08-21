import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"

import {ApiError} from "../utils/apierror.js"
import {ApiResponse} from "../utils/apiREsponse.js"
import {asyncHandler} from "../utils/async_handler.js"
import {uploadOnCloudinary} from "../utils/clouddinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const videos = await Video.aggregatePaginate(query, {
        
        
        page: parseInt(page),
        limit : parseInt(limit),
        sortby : {[sortBy]: sortType},
        userId : isValidObjectId(userId) ? userId : null,
        customLabels : {
            docs : "videos"
        }
    
        
    })
    console.log(videos);
    

    if (!videos) {
        return next(new ApiError(400,"No Videos found"))
    }

    res.status(200)
    .json(new ApiResponse(200,{videos:videos},"All Videos Fetch Successfully"))
})









const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video
    const { title, description} = req.body

    if ([title, description].some((feild)=> {
        feild?.trim() === ""
    })) {
        throw new ApiError (401,"all field Required")
    }

    const videoLocalPath = req.files.videoFile.path[0]



})

// const getVideoById = asyncHandler(async (req, res) => {
//     const { videoId } = req.params
//     //TODO: get video by id
// })

// const updateVideo = asyncHandler(async (req, res) => {
//     const { videoId } = req.params
//     //TODO: update video details like title, description, thumbnail

// })

// const deleteVideo = asyncHandler(async (req, res) => {
//     const { videoId } = req.params
//     //TODO: delete video
// })

// const togglePublishStatus = asyncHandler(async (req, res) => {
//     const { videoId } = req.params
// })

export {
    getAllVideos
    // publishAVideo,
    // getVideoById,
    // updateVideo,
    // deleteVideo,
    // togglePublishStatus
}