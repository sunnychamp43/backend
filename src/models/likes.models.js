
import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";


const likesSchema = new Schema({
    comment : {
        type: Schema.Types.ObjectId,
        ref : "Comment"
    },
    
    video : [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],

    tweet : {
        type: Schema.Types.ObjectId,
        ref: "Tweet"
    },

    likedBy : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }

},{timestamps : true})


export const Like = mongoose.model("Like", likesSchema) 