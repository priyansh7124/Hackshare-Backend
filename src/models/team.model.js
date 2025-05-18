import mongoose, { Schema } from "mongoose";

const teamSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        members: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            role: {
                type: String,
                default: 'member'
            }
        }],
        githubRepos: [
            {
                name: { type: String, required: true },
                url: { type: String, required: true },
            },
        ]
    },
    {
        timestamps: true
    }
);

export const Team = mongoose.model("Team", teamSchema);
