import mongoose from "mongoose";
import { DB_NAME } from "../constants";



const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGOURI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB Host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("Mongo connection error",error);
        process.exit(1)
    }
}



export default connectDB