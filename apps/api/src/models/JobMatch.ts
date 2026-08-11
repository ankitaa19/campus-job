import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IJobMatch extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  studentId: Types.ObjectId;
  jobId: Types.ObjectId;
  score: number;
  embeddingSimilarity: number;
  skillOverlapRatio: number;
  matchedSkills: string[];
  filterReasons: string[];
  createdAt: Date;
  updatedAt: Date;
}

const JobMatchSchema = new Schema<IJobMatch>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  score: { type: Number, required: true, min: 0, max: 1, index: true },
  embeddingSimilarity: { type: Number, required: true, min: 0, max: 1 },
  skillOverlapRatio: { type: Number, required: true, min: 0, max: 1 },
  matchedSkills: [{ type: String, trim: true, lowercase: true }],
  filterReasons: [{ type: String, trim: true }]
}, {
  timestamps: true,
  collection: 'job_matches'
});

JobMatchSchema.index({ userId: 1, jobId: 1 }, { unique: true });
JobMatchSchema.index({ userId: 1, score: -1, createdAt: -1 });

export const JobMatch = mongoose.model<IJobMatch>('JobMatch', JobMatchSchema);

