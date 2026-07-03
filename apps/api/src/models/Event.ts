import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEvent extends Document {
  _id: Types.ObjectId;
  collegeId: Types.ObjectId;
  recruiterId?: Types.ObjectId;
  organizerId?: Types.ObjectId; // Could be college admin or external organizer
  
  // Event Details
  title: string;
  description: string;
  eventType: 'placement_drive' | 'job_fair' | 'seminar' | 'workshop' | 'webinar' | 'campus_visit' | 'tech_talk' | 'hackathon' | 'competition' | 'cultural' | 'sports' | 'other';
  category: 'academic' | 'placement' | 'cultural' | 'sports' | 'technical' | 'recruitment' | 'general';
  
  // Timing
  startDateTime: Date;
  endDateTime: Date;
  duration?: number; // Duration in minutes
  timezone: string;
  
  // Location
  venue: string;
  venueType: 'physical' | 'virtual' | 'hybrid';
  venueAddress?: string;
  meetingLink?: string; // For virtual events
  
  // Participation
  targetAudience: string[]; // e.g., ['final-year', 'CSE', 'ECE']
  maxParticipants?: number;
  registrationRequired: boolean;
  registrationDeadline?: Date;
  
  // Requirements
  eligibilityCriteria?: {
    minCGPA?: number;
    allowedBranches?: string[];
    graduationYear?: number[];
    skills?: string[];
    maxBacklogs?: number;
  };
  
  // Resources
  bannerImage?: string;
  attachments?: string[]; // Document URLs
  tags: string[];
  
  // Registration & Attendance
  registeredStudents: Types.ObjectId[];
  attendedStudents: Types.ObjectId[];
  feedback?: Array<{
    studentId: Types.ObjectId;
    rating: number;
    comment?: string;
    submittedAt: Date;
  }>;
  
  // Status
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  isPublic: boolean;
  
  // Results (for placement events)
  results?: {
    totalRegistrations: number;
    totalAttendees: number;
    placementsOffered?: number;
    companiesParticipated?: string[];
  };
  
  // Contact Information
  contactPerson?: {
    name: string;
    email: string;
    phone?: string;
    designation?: string;
  };
  
  // Notifications
  reminderSent: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>({
  collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
  recruiterId: { type: Schema.Types.ObjectId, ref: 'Recruiter' },
  organizerId: { type: Schema.Types.ObjectId, ref: 'User' },
  
  // Event Details
  title: { type: String, required: true, trim: true, index: true },
  description: { type: String, required: true, trim: true },
  eventType: { 
    type: String, 
    enum: ['placement_drive', 'job_fair', 'seminar', 'workshop', 'webinar', 'campus_visit', 'tech_talk', 'hackathon', 'competition', 'cultural', 'sports', 'other'],
    required: true,
    index: true
  },
  category: { 
    type: String, 
    enum: ['academic', 'placement', 'cultural', 'sports', 'technical', 'recruitment', 'general'],
    required: true,
    index: true
  },
  
  // Timing
  startDateTime: { type: Date, required: true, index: true },
  endDateTime: { type: Date, required: true },
  duration: { type: Number }, // Duration in minutes
  timezone: { type: String, default: 'Asia/Kolkata' },
  
  // Location
  venue: { type: String, required: true, trim: true },
  venueType: { 
    type: String, 
    enum: ['physical', 'virtual', 'hybrid'], 
    default: 'physical' 
  },
  venueAddress: { type: String, trim: true },
  meetingLink: { type: String, trim: true },
  
  // Participation
  targetAudience: [{ type: String, trim: true }],
  maxParticipants: { type: Number, min: 1 },
  registrationRequired: { type: Boolean, default: true },
  registrationDeadline: { type: Date },
  
  // Requirements
  eligibilityCriteria: {
    minCGPA: { type: Number, min: 0, max: 10 },
    allowedBranches: [{ type: String }],
    graduationYear: [{ type: Number }],
    skills: [{ type: String }],
    maxBacklogs: { type: Number, min: 0 }
  },
  
  // Resources
  bannerImage: { type: String, trim: true },
  attachments: [{ type: String, trim: true }],
  tags: [{ type: String, trim: true }],
  
  // Registration & Attendance
  registeredStudents: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  attendedStudents: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  feedback: [{
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true },
    submittedAt: { type: Date, default: Date.now }
  }],
  
  // Status
  status: { 
    type: String, 
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'], 
    default: 'draft',
    index: true
  },
  isPublic: { type: Boolean, default: true },
  
  // Results
  results: {
    totalRegistrations: { type: Number, default: 0 },
    totalAttendees: { type: Number, default: 0 },
    placementsOffered: { type: Number },
    companiesParticipated: [{ type: String }]
  },
  
  // Contact Information
  contactPerson: {
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    designation: { type: String, trim: true }
  },
  
  // Notifications
  reminderSent: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes for optimization
EventSchema.index({ collegeId: 1, startDateTime: 1 });
EventSchema.index({ status: 1, startDateTime: 1 });
EventSchema.index({ eventType: 1, category: 1 });
EventSchema.index({ 'eligibilityCriteria.graduationYear': 1 });
EventSchema.index({ tags: 1 });

// Virtual for calculating if event is live
EventSchema.virtual('isLive').get(function() {
  const now = new Date();
  return this.startDateTime <= now && this.endDateTime >= now && this.status === 'ongoing';
});

// Virtual for calculating if registration is open
EventSchema.virtual('isRegistrationOpen').get(function() {
  const now = new Date();
  return this.registrationRequired && 
         this.status === 'published' && 
         (!this.registrationDeadline || this.registrationDeadline >= now) &&
         this.startDateTime > now;
});

export const Event = mongoose.model<IEvent>('Event', EventSchema);