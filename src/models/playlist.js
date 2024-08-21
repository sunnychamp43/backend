import mongoose,{Schema} from "mongoose";


const playlistSchema = new Schema({

    name : {
        type : String,

    },
    description : {
        type: String,

    },

    videos : [
       {
        type : Schema.Types.ObjectId,
        ref: "Videos"
       }
    ],
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }


}, {timestamps : true})




export const Playlist = mongoose.model("Playlist",playlistSchema)