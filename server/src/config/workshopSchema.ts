import { Schema, model } from "mongoose";

// Define the Workshop Submission Schema
const workshopSubmissionSchema = new Schema({
  workshopId: {
    type: String,
    required: true,
    unique: true,
  },
  professorId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["submitted", "under review", "approved", "rejected"],
    default: "submitted",
  },
  requestedEdits: {
    type: String,
    default: "",
  },
  submissionDate: {
    type: Date,
    default: Date.now,
  },
});

// Create the model
const WorkshopSubmission = model(
  "WorkshopSubmission",
  workshopSubmissionSchema
);

export default WorkshopSubmission;
