import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const routineTaskSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company reference is required"],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Task department is required"],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task performer is required"],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    performedTasks: [
      {
        description: {
          type: String,
          required: [true, "Routine Task description is required"],
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
      },
    ],
    progress: {
      type: Number,
      default: 0,
      min: [0, "Task progress cannot be less than 0"],
      max: [100, "Task progress cannot exceed 100"],
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

// Auto-calculate progress
routineTaskSchema.pre("save", function (next) {
  if (this.isModified("performedTasks")) {
    const total = this.performedTasks.length;
    const completed = this.performedTasks.filter((t) => t.isCompleted).length;
    this.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  }
  next();
});

routineTaskSchema.plugin(mongoosePaginate);

export default mongoose.model("RoutineTask", routineTaskSchema);
