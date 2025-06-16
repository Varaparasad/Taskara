import mongoose from "mongoose";
const projectschema = new mongoose.Schema({
    title: {
        type: String,
        default: `Project#${Date.now()}`,
    },
    description: {
        type: String,
        default: "Project Description"
    },
    CreatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startDate: {
        type: Date,
        default: new Date()
    },
    endDate: {
        type: Date,
        // required: true
    },
    overallStatus: { 
        type: String,
        enum: ['Not Started', 'Active', 'On Hold', 'Completed', 'Delayed', 'Rejected'],
        default: 'Not Started'
    },
    Members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['admin', 'developer','viewer'],
            default: 'viewer'
        },
        status:{
            type:String,
            enum:['accepted','unseen','created'],
            default:'unseen'
        },
        invitationToken:{ 
            type: String,
            default: null
        },
        invitationTokenExpires:{ 
            type: Date,
            default: null
        }
    }]
},{timestamps:true})

export const Project = mongoose.model('Project', projectschema)