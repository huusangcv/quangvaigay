import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    uploadedBy: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      match: /^[a-zA-Z]+$/,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    storageProvider: {
      type: String,
      enum: ["local", "mongo"],
      default: "local",
      required: true,
    },
    bufferData: {
      type: Buffer,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Song = mongoose.model("Song", songSchema);

export default Song;
