import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    projects: [{
       projectID:{ type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
       },
       role:{
        type:String,
        enum:['admin','developer','viewer'],
        default:'viewer'
       },
       status:{
        type:String,
        enum:['accepted','rejected','unseen','created'],
        default:'unseen'
       }
    }],
    profilePic: {
        type: String,
        default: 'https://placehold.co/150x150/cbd5e1/1f2937?text=User'
    },
    refreshtoken: {
        type: String,
        default: null
    }
}, { timestamps: true });

userSchema.pre("save",async function (next) {
    if(this.isModified("password")){
        this.password=await bcrypt.hash(this.password,10)
        next()
    }
    else{
        next()
    }
})

userSchema.methods.isPasswordcorrect=function(passwd){
    return bcrypt.compare(passwd,this.password)
}

userSchema.methods.generateaccesstoken=function () {
    return jwt.sign({
        _id:this._id,
        email:this.email,
        name:this.name
    },process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    })
}

userSchema.methods.generaterefreshtoken=function () {
    return jwt.sign({
        _id:this._id
    },process.env.REFRESH_TOKEN_SECRET,{
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    })
}

export const User=mongoose.model('User', userSchema);
