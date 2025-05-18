// models/contact.model.js

import mongoose, { Schema } from "mongoose";

const contactSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    adminMessage: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: Boolean,
      default: "false",
    },
  },
  {
    timestamps: true,
  }
);

export const Contact = mongoose.model("Contact", contactSchema);
