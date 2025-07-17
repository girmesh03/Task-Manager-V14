import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

// Status transition rules
const validTransitions = {
  "To Do": ["In Progress", "Pending"],
  "In Progress": ["In Progress", "Completed", "Pending"], // Allow self-transition
  Completed: ["Pending", "In Progress"],
  Pending: ["In Progress", "Completed"],
};

const taskActivitySchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task reference is required"],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Performed user is required"],
    },
    description: {
      type: String,
      required: [true, "Activity description is required"],
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    statusChange: {
      from: {
        type: String,
        enum: Object.keys(validTransitions),
      },
      to: {
        type: String,
        enum: Object.keys(validTransitions),
        required: [true, "Status change is required"],
      },
    },
    attachments: [
      {
        _id: false,
        url: { type: String },
        public_id: { type: String },
        type: {
          type: String,
          enum: ["image", "video", "pdf"],
          default: "image",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.id;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret.id;
        return ret;
      },
    },
  }
);

// Status transition validation
taskActivitySchema.pre("save", async function (next) {
  const session = this.$session();
  const task = await mongoose
    .model("Task")
    .findById(this.task)
    .session(session);

  if (this.statusChange) {
    // Auto-fill 'from' status
    if (!this.statusChange.from) this.statusChange.from = task.status;

    // Validate current task status
    if (this.statusChange.from !== task.status) {
      return next(new CustomError("Status transition mismatch", 400));
    }

    // Validate transition rules
    if (
      !validTransitions[this.statusChange.from]?.includes(this.statusChange.to)
    ) {
      return next(new CustomError("Invalid status transition", 400));
    }

    // Update parent task
    task.status = this.statusChange.to;
    await task.save({ session });
  }
  next();
});

taskActivitySchema.plugin(mongoosePaginate);

export default mongoose.model("TaskActivity", taskActivitySchema);
