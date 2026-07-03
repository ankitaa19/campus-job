import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  _id: Types.ObjectId;
  
  // Recipient Information
  recipientId: Types.ObjectId;
  recipientType: 'student' | 'recruiter' | 'college';
  
  // Notification Content
  title: string;
  message: string;
  notificationType: 'job_match' | 'application_status' | 'interview_reminder' | 'college_approval' | 'new_applicant' | 'system' | 'promotional';
  
  // Delivery Channels
  channels: {
    platform: boolean;
    email: boolean;
    whatsapp: boolean;
    push: boolean;
  };
  
  // Delivery Status
  deliveryStatus: {
    platform: 'pending' | 'sent' | 'read' | 'failed';
    email: 'pending' | 'sent' | 'delivered' | 'failed';
    whatsapp: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    push: 'pending' | 'sent' | 'delivered' | 'failed';
  };
  
  // Related Entities
  relatedJobId?: Types.ObjectId;
  relatedApplicationId?: Types.ObjectId;
  relatedCollegeId?: Types.ObjectId;
  
  // Scheduling
  scheduledAt?: Date;
  sentAt?: Date;
  
  // Priority & Urgency
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isUrgent: boolean;
  
  // Action Required
  actionRequired: boolean;
  actionUrl?: string;
  actionText?: string;
  
  // Personalization
  personalizationData?: Record<string, any>;
  templateId?: string;
  metadata?: Record<string, any>;
  
  // Engagement
  readAt?: Date;
  clickedAt?: Date;
  
  // Retry Logic
  retryCount: number;
  maxRetries: number;
  
  // Expiration
  expiresAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  // Recipient Information
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recipientType: { type: String, enum: ['student', 'recruiter', 'college'], required: true },
  
  // Notification Content
  title: { type: String, required: true },
  message: { type: String, required: true },
  notificationType: { 
    type: String, 
    enum: ['job_match', 'application_status', 'interview_reminder', 'college_approval', 'new_applicant', 'system', 'promotional'], 
    required: true,
    index: true 
  },
  
  // Delivery Channels
  channels: {
    platform: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  },
  
  // Delivery Status
  deliveryStatus: {
    platform: { type: String, enum: ['pending', 'sent', 'read', 'failed'], default: 'pending' },
    email: { type: String, enum: ['pending', 'sent', 'delivered', 'failed'], default: 'pending' },
    whatsapp: { type: String, enum: ['pending', 'sent', 'delivered', 'read', 'failed'], default: 'pending' },
    push: { type: String, enum: ['pending', 'sent', 'delivered', 'failed'], default: 'pending' }
  },
  
  // Related Entities
  relatedJobId: { type: Schema.Types.ObjectId, ref: 'Job', index: true },
  relatedApplicationId: { type: Schema.Types.ObjectId, ref: 'Application', index: true },
  relatedCollegeId: { type: Schema.Types.ObjectId, ref: 'College', index: true },
  
  // Scheduling
  scheduledAt: { type: Date },
  sentAt: { type: Date },
  
  // Priority & Urgency
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium', index: true },
  isUrgent: { type: Boolean, default: false, index: true },
  
  // Action Required
  actionRequired: { type: Boolean, default: false },
  actionUrl: { type: String },
  actionText: { type: String },
  
  // Personalization
  personalizationData: { type: Schema.Types.Mixed },
  templateId: { type: String },
  metadata: { type: Schema.Types.Mixed },
  
  // Engagement
  readAt: { type: Date },
  clickedAt: { type: Date },
  
  // Retry Logic
  retryCount: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },
  
  // Expiration
  expiresAt: { type: Date }
}, {
  timestamps: true
});

// Indexes for optimization
NotificationSchema.index({ recipientId: 1, recipientType: 1 });
NotificationSchema.index({ notificationType: 1, recipientType: 1 });
NotificationSchema.index({ scheduledAt: 1, 'deliveryStatus.platform': 1 });
NotificationSchema.index({ priority: 1, isUrgent: 1 });
NotificationSchema.index({ relatedJobId: 1, notificationType: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 });

// Compound indexes for complex queries
NotificationSchema.index({ 
  recipientId: 1, 
  'deliveryStatus.platform': 1, 
  createdAt: -1 
});

NotificationSchema.index({ 
  'deliveryStatus.whatsapp': 1, 
  retryCount: 1, 
  maxRetries: 1 
});

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
