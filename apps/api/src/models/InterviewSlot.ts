import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInterviewSlot extends Document {
  // Core relationships
  jobId: Types.ObjectId;
  recruiterId: Types.ObjectId;
  collegeId: Types.ObjectId;
  
  // Slot details
  title: string;
  description?: string;
  
  // Scheduling
  scheduledDate: Date;
  startTime: string; // Format: "09:00"
  endTime: string;   // Format: "17:00"
  duration: number;  // Duration per candidate in minutes
  
  // Capacity and assignments
  totalCapacity: number;
  availableSlots: number;
  assignedCandidates: {
    studentId: Types.ObjectId;
    timeSlot: string; // Specific time assigned (e.g., "09:00-09:30")
    status: 'assigned' | 'confirmed' | 'attended' | 'no_show' | 'cancelled';
    assignedAt: Date;
    confirmedAt?: Date;
    notes?: string;
  }[];
  
  // Waitlist for overflow candidates
  waitlistCandidates: {
    studentId: Types.ObjectId;
    addedAt: Date;
    priority: number; // Lower number = higher priority
    notes?: string;
  }[];
  
  // Interview mode
  mode: 'physical' | 'virtual' | 'hybrid';
  location?: {
    venue: string;
    address: string;
    room?: string;
    landmarks?: string;
  };
  virtualMeetingDetails?: {
    platform: string; // Zoom, Teams, Meet
    meetingId: string;
    passcode?: string;
    joinUrl: string;
  };
  
  // Requirements and eligibility
  eligibilityCriteria: {
    minCGPA?: number;
    requiredSkills?: string[];
    courses: string[];
    graduationYear: number;
    maxBacklogs?: number;
  };
  
  // Auto-assignment settings
  autoAssignmentSettings: {
    isEnabled: boolean;
    assignmentAlgorithm: 'score_based' | 'first_come_first_serve' | 'random';
    minimumScore?: number; // AI matching score threshold
    preferredColleges?: Types.ObjectId[]; // Priority colleges
  };
  
  // Status and workflow
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
  publishedAt?: Date;
  completedAt?: Date;
  
  // Interview panel
  interviewers: {
    name: string;
    designation: string;
    email: string;
    phoneNumber?: string;
  }[];
  
  // Communication
  notifications: {
    sent: boolean;
    sentAt?: Date;
    type: 'assignment' | 'reminder_24h' | 'reminder_2h' | 'confirmation';
    recipients: Types.ObjectId[]; // Student IDs
  }[];
  
  // Instructions for candidates
  candidateInstructions: {
    preInterviewInstructions?: string;
    documentsRequired?: string[];
    dresscode?: string;
    additionalNotes?: string;
  };
  
  // Metadata
  createdBy: Types.ObjectId;
  lastModifiedBy: Types.ObjectId;
  isActive: boolean;
}

const InterviewSlotSchema = new Schema<IInterviewSlot>({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  recruiterId: { type: Schema.Types.ObjectId, ref: 'Recruiter', required: true, index: true },
  collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
  
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  
  scheduledDate: { type: Date, required: true, index: true },
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "17:00"
  duration: { type: Number, required: true, min: 15, max: 180 }, // 15 min to 3 hours
  
  totalCapacity: { type: Number, required: true, min: 1 },
  availableSlots: { type: Number, required: true, min: 0 },
  
  assignedCandidates: [{
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    timeSlot: { type: String, required: true },
    status: {
      type: String,
      enum: ['assigned', 'confirmed', 'attended', 'no_show', 'cancelled'],
      default: 'assigned',
      index: true
    },
    assignedAt: { type: Date, default: Date.now },
    confirmedAt: { type: Date },
    notes: { type: String }
  }],
  
  waitlistCandidates: [{
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    addedAt: { type: Date, default: Date.now },
    priority: { type: Number, required: true, min: 1 },
    notes: { type: String }
  }],
  
  mode: {
    type: String,
    enum: ['physical', 'virtual', 'hybrid'],
    required: true,
    index: true
  },
  
  location: {
    venue: { type: String },
    address: { type: String },
    room: { type: String },
    landmarks: { type: String }
  },
  
  virtualMeetingDetails: {
    platform: { type: String },
    meetingId: { type: String },
    passcode: { type: String },
    joinUrl: { type: String }
  },
  
  eligibilityCriteria: {
    minCGPA: { type: Number },
    requiredSkills: [{ type: String }],
    courses: [{ type: String, required: true }],
    graduationYear: { type: Number, required: true },
    maxBacklogs: { type: Number, default: 0 }
  },
  
  autoAssignmentSettings: {
    isEnabled: { type: Boolean, default: true },
    assignmentAlgorithm: {
      type: String,
      enum: ['score_based', 'first_come_first_serve', 'random'],
      default: 'score_based'
    },
    minimumScore: { type: Number, min: 0, max: 100 },
    preferredColleges: [{ type: Schema.Types.ObjectId, ref: 'College' }]
  },
  
  status: {
    type: String,
    enum: ['draft', 'published', 'in_progress', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },
  
  publishedAt: { type: Date },
  completedAt: { type: Date },
  
  interviewers: [{
    name: { type: String, required: true },
    designation: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String }
  }],
  
  notifications: [{
    sent: { type: Boolean, default: false },
    sentAt: { type: Date },
    type: {
      type: String,
      enum: ['assignment', 'reminder_24h', 'reminder_2h', 'confirmation'],
      required: true
    },
    recipients: [{ type: Schema.Types.ObjectId, ref: 'Student' }]
  }],
  
  candidateInstructions: {
    preInterviewInstructions: { type: String },
    documentsRequired: [{ type: String }],
    dresscode: { type: String },
    additionalNotes: { type: String }
  },
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
InterviewSlotSchema.index({ jobId: 1, scheduledDate: 1 });
InterviewSlotSchema.index({ recruiterId: 1, status: 1 });
InterviewSlotSchema.index({ collegeId: 1, scheduledDate: 1 });
InterviewSlotSchema.index({ status: 1, scheduledDate: 1 });
InterviewSlotSchema.index({ 'assignedCandidates.studentId': 1, 'assignedCandidates.status': 1 });

// Methods for slot management
InterviewSlotSchema.methods.assignCandidate = function(studentId: string, autoGenerate = true) {
  if (this.availableSlots <= 0) {
    throw new Error('No available slots');
  }
  
  // Check if already assigned
  const existingAssignment = this.assignedCandidates.find(
    (candidate: any) => candidate.studentId.toString() === studentId
  );
  
  if (existingAssignment) {
    throw new Error('Candidate already assigned');
  }
  
  // Generate time slot if auto-generate is enabled
  let timeSlot = '';
  if (autoGenerate) {
    const assignedSlots = this.assignedCandidates.map((c: any) => c.timeSlot);
    timeSlot = this.generateNextAvailableTimeSlot(assignedSlots);
  }
  
  this.assignedCandidates.push({
    studentId: new mongoose.Types.ObjectId(studentId),
    timeSlot,
    status: 'assigned',
    assignedAt: new Date()
  });
  
  this.availableSlots -= 1;
  return this.save();
};

InterviewSlotSchema.methods.addToWaitlist = function(studentId: string) {
  const nextPriority = Math.max(...this.waitlistCandidates.map((c: any) => c.priority), 0) + 1;
  
  this.waitlistCandidates.push({
    studentId: new mongoose.Types.ObjectId(studentId),
    addedAt: new Date(),
    priority: nextPriority
  });
  
  return this.save();
};

InterviewSlotSchema.methods.generateNextAvailableTimeSlot = function(assignedSlots: string[]) {
  const startTime = this.startTime; // "09:00"
  const endTime = this.endTime;     // "17:00"
  const duration = this.duration;   // minutes
  
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  for (let current = startMinutes; current + duration <= endMinutes; current += duration) {
    const slotStart = minutesToTime(current);
    const slotEnd = minutesToTime(current + duration);
    const timeSlot = `${slotStart}-${slotEnd}`;
    
    if (!assignedSlots.includes(timeSlot)) {
      return timeSlot;
    }
  }
  
  throw new Error('No available time slots');
};

InterviewSlotSchema.methods.confirmAttendance = function(studentId: string) {
  const candidate = this.assignedCandidates.find(
    (c: any) => c.studentId.toString() === studentId
  );
  
  if (!candidate) {
    throw new Error('Candidate not found in assigned list');
  }
  
  candidate.status = 'confirmed';
  candidate.confirmedAt = new Date();
  
  return this.save();
};

InterviewSlotSchema.methods.markAttended = function(studentId: string) {
  const candidate = this.assignedCandidates.find(
    (c: any) => c.studentId.toString() === studentId
  );
  
  if (!candidate) {
    throw new Error('Candidate not found in assigned list');
  }
  
  candidate.status = 'attended';
  return this.save();
};

InterviewSlotSchema.methods.markNoShow = function(studentId: string) {
  const candidate = this.assignedCandidates.find(
    (c: any) => c.studentId.toString() === studentId
  );
  
  if (!candidate) {
    throw new Error('Candidate not found in assigned list');
  }
  
  candidate.status = 'no_show';
  
  // Try to fill from waitlist
  if (this.waitlistCandidates.length > 0) {
    const nextCandidate = this.waitlistCandidates.sort((a: any, b: any) => a.priority - b.priority)[0];
    this.assignCandidate(nextCandidate.studentId.toString());
    this.waitlistCandidates = this.waitlistCandidates.filter(
      (c: any) => c.studentId.toString() !== nextCandidate.studentId.toString()
    );
  } else {
    this.availableSlots += 1;
  }
  
  return this.save();
};

// Static methods
InterviewSlotSchema.statics.findByJob = function(jobId: string) {
  return this.find({ jobId, isActive: true })
    .populate('assignedCandidates.studentId', 'firstName lastName email collegeId')
    .populate('waitlistCandidates.studentId', 'firstName lastName email collegeId')
    .sort({ scheduledDate: 1 });
};

InterviewSlotSchema.statics.findUpcoming = function(days: number = 7) {
  const today = new Date();
  const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return this.find({
    scheduledDate: { $gte: today, $lte: futureDate },
    status: { $in: ['published', 'in_progress'] },
    isActive: true
  }).sort({ scheduledDate: 1 });
};

// Helper functions
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export const InterviewSlot = mongoose.model<IInterviewSlot>('InterviewSlot', InterviewSlotSchema);
