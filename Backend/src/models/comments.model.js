import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
    },
    userName: { 
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
        trim: true,
    },
    attachment: { 
        filename: String, // Original name of the file
        url: String,      // URL path to access the file (e.g., /uploads/myimage.jpg)
        mimetype: String, // MIME type of the file (e.g., image/jpeg)
        size: Number,     // Size of the file in bytes
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export const Comment = mongoose.model('Comment', commentSchema);