import mongoose from "mongoose";

const ticketschema=new mongoose.Schema({
    title:{
        type:String,
        default:"Issue"
    },
    description:{
        type:String,
        default:"Bug here"
    },
    priority:{
        type:String,
        enum:["low","medium","high"],
        default:"low"
    },
    status:{
        type:String,
        enum:["todo","in_progress","done"],
        default:"todo"
    },
    assignee:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    projectID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Project'
    },
    DueDate:{
        type:Date,
        required:true
    }
},{timestamps:true})

export const Ticket=mongoose.model('Ticket',ticketschema)