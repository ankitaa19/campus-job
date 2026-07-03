import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInvitation extends Document {
  // Core relationship fields
  jobId: Types.ObjectId;
  collegeId: Types.ObjectId;
  recruiterId: Types.ObjectId;
  
  // Invitation details
  status: 'pending' | 'accepted' | 'declined' | 'negotiating' | 'expired';
  invitationMessage?: string;
  
  // Date and scheduling
  proposedDates: {
    startDate: Date;
    endDate: Date;
    isFlexible: boolean;
    preferredTimeSlots: string[];
  }[];
  
  campusVisitWindow?: {
    confirmedStartDate: Date;
    confirmedEndDate: Date;
    visitMode: 'physical' | 'virtual' | 'hybrid';
    maxStudents: number;
  };
  
  // TPO response details
  tpoResponse?: {
    responseDate: Date;
    responseMessage?: string;
    counterProposal?: {
      alternativeDates: {
        startDate: Date;
        endDate: Date;
        note?: string;
      }[];
      additionalRequirements?: string;
    };
  };
  
  // Negotiation history
  negotiationHistory: {
    timestamp: Date;
    actor: 'recruiter' | 'tpo';
    action: 'proposed' | 'accepted' | 'declined' | 'counter_proposed' | 'resent';
    details: string;
    proposedDates?: {
      startDate: Date;
      endDate: Date;
    }[];
  }[];
  
  // Metadata
  sentAt: Date;
  respondedAt?: Date;
  expiresAt: Date;
  remindersSent: number;
  
  // Status tracking
  isActive: boolean;
  lastUpdated: Date;
  updatedBy: Types.ObjectId;
}

const InvitationSchema = new Schema<IInvitation>({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
  recruiterId: { type: Schema.Types.ObjectId, ref: 'Recruiter', required: true, index: true },
  
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'negotiating', 'expired'],
    default: 'pending',
    index: true
  },
  invitationMessage: { type: String },
  
  proposedDates: [{
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isFlexible: { type: Boolean, default: false },
    preferredTimeSlots: [{ type: String }]
  }],
  
  campusVisitWindow: {
    confirmedStartDate: { type: Date },
    confirmedEndDate: { type: Date },
    visitMode: {
      type: String,
      enum: ['physical', 'virtual', 'hybrid'],
      default: 'physical'
    },
    maxStudents: { type: Number }
  },
  
  tpoResponse: {
    responseDate: { type: Date },
    responseMessage: { type: String },
    counterProposal: {
      alternativeDates: [{
        startDate: { type: Date },
        endDate: { type: Date },
        note: { type: String }
      }],
      additionalRequirements: { type: String }
    }
  },
  
  negotiationHistory: [{
    timestamp: { type: Date, default: Date.now },
    actor: {
      type: String,
      enum: ['recruiter', 'tpo'],
      required: true
    },
    action: {
      type: String,
      enum: ['proposed', 'accepted', 'declined', 'counter_proposed', 'resent'],
      required: true
    },
    details: { type: String, required: true },
    proposedDates: [{
      startDate: { type: Date },
      endDate: { type: Date }
    }]
  }],
  
  sentAt: { type: Date, default: Date.now, index: true },
  respondedAt: { type: Date },
  expiresAt: { type: Date, required: true, index: true },
  remindersSent: { type: Number, default: 0 },
  
  isActive: { type: Boolean, default: true, index: true },
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

// Indexes for efficient queries
InvitationSchema.index({ jobId: 1, collegeId: 1 }, { unique: true });
InvitationSchema.index({ status: 1, expiresAt: 1 });
InvitationSchema.index({ sentAt: -1 });
InvitationSchema.index({ 'campusVisitWindow.confirmedStartDate': 1 });

// Methods for invitation lifecycle
InvitationSchema.methods.acceptInvitation = function(
  visitWindow: any,
  tpoMessage?: string
) {
  this.status = 'accepted';
  this.respondedAt = new Date();
  this.campusVisitWindow = visitWindow;
  this.tpoResponse = {
    responseDate: new Date(),
    responseMessage: tpoMessage
  };
  
  this.negotiationHistory.push({
    timestamp: new Date(),
    actor: 'tpo',
    action: 'accepted',
    details: tpoMessage || 'Invitation accepted'
  });
  
  return this.save();
};

InvitationSchema.methods.declineInvitation = function(reason?: string) {
  this.status = 'declined';
  this.respondedAt = new Date();
  this.tpoResponse = {
    responseDate: new Date(),
    responseMessage: reason
  };
  
  this.negotiationHistory.push({
    timestamp: new Date(),
    actor: 'tpo',
    action: 'declined',
    details: reason || 'Invitation declined'
  });
  
  return this.save();
};

InvitationSchema.methods.proposeCounterDates = function(
  alternativeDates: any[],
  message?: string
) {
  this.status = 'negotiating';
  this.respondedAt = new Date();
  this.tpoResponse = {
    responseDate: new Date(),
    responseMessage: message,
    counterProposal: {
      alternativeDates,
      additionalRequirements: message
    }
  };
  
  this.negotiationHistory.push({
    timestamp: new Date(),
    actor: 'tpo',
    action: 'counter_proposed',
    details: message || 'Counter proposal submitted',
    proposedDates: alternativeDates
  });
  
  return this.save();
};

// Static methods
InvitationSchema.statics.findExpired = function() {
  return this.find({
    status: 'pending',
    expiresAt: { $lt: new Date() },
    isActive: true
  });
};

InvitationSchema.statics.findByCollege = function(collegeId: string) {
  return this.find({ collegeId, isActive: true })
    .populate('jobId', 'title companyName salary applicationDeadline')
    .populate('recruiterId', 'companyInfo.name recruiterProfile')
    .sort({ sentAt: -1 });
};

InvitationSchema.statics.findByJob = function(jobId: string) {
  return this.find({ jobId, isActive: true })
    .populate('collegeId', 'name address.city')
    .sort({ sentAt: -1 });
};

export const Invitation = mongoose.model<IInvitation>('Invitation', InvitationSchema);
