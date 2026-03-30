import mongoose from "mongoose";

const wishSchema = new mongoose.Schema(
  {
    senderName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      match: /^[a-zA-Z]+$/,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Wish = mongoose.model("Wish", wishSchema);

export default Wish;