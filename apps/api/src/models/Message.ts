import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  senderType: 'student' | 'recruiter' | 'college';
  receiverType: 'student' | 'recruiter' | 'college';
  content: string;
  messageType: 'text' | 'file' | 'application' | 'notification';
  isRead: boolean;
  readAt?: Date;
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }[];
  relatedJobId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  senderId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'senderType'
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'receiverType'
  },
  senderType: {
    type: String,
    required: true,
    enum: ['student', 'recruiter', 'college']
  },
  receiverType: {
    type: String,
    required: true,
    enum: ['student', 'recruiter', 'college']
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    required: true,
    enum: ['text', 'file', 'application', 'notification'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  attachments: [{
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true }
  }],
  relatedJobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job'
  }
}, {
  timestamps: true
});

MessageSchema.index({ senderId: 1, receiverId: 1 });
MessageSchema.index({ createdAt: -1 });
MessageSchema.index({ isRead: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
