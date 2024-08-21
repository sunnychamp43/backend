import {Router} from "express";
import { avatarCoverImage, changeCurrentPassword, getCurrentUser, getUserChannelProfile, loginUser, logoutUser, refreshAccessToken, registerUser, UpdateAccountDetails, updateUserCoverImage } from "../cantrollers/user.cantroller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post(
    upload.fields([{
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
    ]),
    registerUser)

router.route("/login").post(loginUser)

// secured routes

router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-Token").post(refreshAccessToken)

router.route("/update-details").patch(verifyJWT,UpdateAccountDetails)

router.route("/current-user").get(verifyJWT,getCurrentUser)

router.route("/change-password").post(verifyJWT,changeCurrentPassword)

router.route("/change-avatar").patch(verifyJWT, upload.single("avatar"), avatarCoverImage)

router.route("/change-coverimage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/user-profile").get(verifyJWT,getUserChannelProfile)


export default router