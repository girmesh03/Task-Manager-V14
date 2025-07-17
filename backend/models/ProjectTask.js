import mongoose from "mongoose";
import Task from "./Task.js";

const projectTaskSchema = new mongoose.Schema(
  {
    clientInfo: {
      name: {
        type: String,
        required: [true, "Company name is required"],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, "Company phone number is required"],
        trim: true,
        minlength: [10, "Phone number must be at least 10 characters"],
        maxlength: [13, "Phone number cannot exceed 13 characters"],
        validate: {
          validator: (v) => /^(09\d{8}|\+2519\d{8})$/.test(v),
          message: "Invalid phone number format for Ethiopia.",
        },
      },
      address: {
        type: String,
        trim: true,
      },
    },
  },
  {
    toJSON: Task.schema.options.toJSON,
    toObject: Task.schema.options.toObject,
  }
);

// Pre-save hook to format the phone number
projectTaskSchema.pre("save", async function (next) {
  if (this.isModified("clientInfo.phone")) {
    this.clientInfo.phone = this.clientInfo.phone.startsWith("09")
      ? this.clientInfo.phone.replace("09", "+2519")
      : this.clientInfo.phone;
  }
  next();
});

export default Task.discriminator("ProjectTask", projectTaskSchema);
