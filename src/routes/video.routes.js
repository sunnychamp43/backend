import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllVideos } from "../cantrollers/video.cantroller.js"




const router = Router()


router.route("/").get(getAllVideos)


export default router


