import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    filename: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
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

const Media = mongoose.model("Media", mediaSchema);

export default Media;
