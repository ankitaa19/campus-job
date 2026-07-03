import express from 'express';
import { Event } from '../models/Event';
import { College } from '../models/College';
import { Student } from '../models/Student';
import authMiddleware from '../middleware/auth';
import { Types } from 'mongoose';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// Get all events for authenticated college
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    const { 
      eventType, 
      category, 
      status = 'published',
      upcoming,
      startDate,
      endDate,
      page = 1, 
      limit = 10,
      sortBy = 'startDateTime',
      sortOrder = 'asc'
    } = req.query;

    // Build filter criteria
    const filterCriteria: any = { collegeId: college._id };

    if (eventType) filterCriteria.eventType = eventType;
    if (category) filterCriteria.category = category;
    if (status !== 'all') filterCriteria.status = status;
    
    if (upcoming === 'true') {
      filterCriteria.startDateTime = { $gte: new Date() };
    }
    
    if (startDate || endDate) {
      filterCriteria.startDateTime = {};
      if (startDate) filterCriteria.startDateTime.$gte = new Date(startDate as string);
      if (endDate) filterCriteria.startDateTime.$lte = new Date(endDate as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const sortConfig: any = {};
    sortConfig[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const events = await Event.find(filterCriteria)
      .populate('recruiterId', 'companyInfo.name companyInfo.industry')
      .populate('organizerId', 'firstName lastName email')
      .sort(sortConfig)
      .skip(skip)
      .limit(parseInt(limit as string))
      .lean();

    const totalCount = await Event.countDocuments(filterCriteria);

    // Enhance events with computed fields
    const enhancedEvents = events.map((event: any) => ({
      ...event,
      registeredCount: event.registeredStudents?.length || 0,
      attendedCount: event.attendedStudents?.length || 0,
      isLive: event.startDateTime <= new Date() && event.endDateTime >= new Date() && event.status === 'ongoing',
      isRegistrationOpen: event.registrationRequired && 
                         event.status === 'published' && 
                         (!event.registrationDeadline || event.registrationDeadline >= new Date()) &&
                         event.startDateTime > new Date()
    }));

    res.status(200).json({
      success: true,
      data: {
        events: enhancedEvents,
        pagination: {
          currentPage: parseInt(page as string),
          totalPages: Math.ceil(totalCount / parseInt(limit as string)),
          totalCount,
          hasNextPage: skip + events.length < totalCount,
          hasPrevPage: parseInt(page as string) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch events',
      error: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
    });
  }
});

// Get single event by ID
router.get('/:eventId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id;
    const { eventId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    const event = await Event.findOne({ _id: eventId, collegeId: college._id })
      .populate('recruiterId', 'companyInfo.name companyInfo.industry')
      .populate('organizerId', 'firstName lastName email')
      .populate('registeredStudents', 'firstName lastName email enrollmentNumber department')
      .populate('attendedStudents', 'firstName lastName email enrollmentNumber department');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const enhancedEvent = {
      ...event.toJSON(),
      registeredCount: event.registeredStudents?.length || 0,
      attendedCount: event.attendedStudents?.length || 0,
      isLive: event.startDateTime <= new Date() && event.endDateTime >= new Date() && event.status === 'ongoing',
      isRegistrationOpen: event.registrationRequired && 
                         event.status === 'published' && 
                         (!event.registrationDeadline || event.registrationDeadline >= new Date()) &&
                         event.startDateTime > new Date()
    };

    res.status(200).json({
      success: true,
      data: enhancedEvent
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch event',
      error: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
    });
  }
});

// Create new event
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    const {
      title,
      description,
      eventType,
      category,
      startDateTime,
      endDateTime,
      venue,
      venueType = 'physical',
      venueAddress,
      meetingLink,
      targetAudience = [],
      maxParticipants,
      registrationRequired = true,
      registrationDeadline,
      eligibilityCriteria,
      tags = [],
      contactPerson,
      status = 'draft'
    } = req.body;

    // Validation
    if (!title || !description || !eventType || !category || !startDateTime || !endDateTime || !venue) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: title, description, eventType, category, startDateTime, endDateTime, venue' 
      });
    }

    // Validate dates
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    if (start >= end) {
      return res.status(400).json({ 
        success: false,
        message: 'Start date must be before end date' 
      });
    }

    // Create event
    const event = new Event({
      collegeId: college._id,
      organizerId: userId,
      title: title.trim(),
      description: description.trim(),
      eventType,
      category,
      startDateTime: start,
      endDateTime: end,
      duration: Math.floor((end.getTime() - start.getTime()) / (1000 * 60)), // Duration in minutes
      timezone: 'Asia/Kolkata',
      venue: venue.trim(),
      venueType,
      venueAddress: venueAddress?.trim(),
      meetingLink: meetingLink?.trim(),
      targetAudience: Array.isArray(targetAudience) ? targetAudience : [],
      maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
      registrationRequired,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
      eligibilityCriteria,
      tags: Array.isArray(tags) ? tags : [],
      contactPerson,
      status,
      registeredStudents: [],
      attendedStudents: [],
      isPublic: true,
      reminderSent: false
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create event',
      error: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
    });
  }
});

// Update event
router.put('/:eventId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id;
    const { eventId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    const event = await Event.findOne({ _id: eventId, collegeId: college._id });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const {
      title,
      description,
      eventType,
      category,
      startDateTime,
      endDateTime,
      venue,
      venueType,
      venueAddress,
      meetingLink,
      targetAudience,
      maxParticipants,
      registrationRequired,
      registrationDeadline,
      eligibilityCriteria,
      tags,
      contactPerson,
      status
    } = req.body;

    // Update fields
    if (title) event.title = title.trim();
    if (description) event.description = description.trim();
    if (eventType) event.eventType = eventType;
    if (category) event.category = category;
    if (startDateTime) {
      event.startDateTime = new Date(startDateTime);
      if (endDateTime) {
        event.endDateTime = new Date(endDateTime);
        event.duration = Math.floor((event.endDateTime.getTime() - event.startDateTime.getTime()) / (1000 * 60));
      }
    }
    if (endDateTime && !startDateTime) {
      event.endDateTime = new Date(endDateTime);
      event.duration = Math.floor((event.endDateTime.getTime() - event.startDateTime.getTime()) / (1000 * 60));
    }
    if (venue) event.venue = venue.trim();
    if (venueType) event.venueType = venueType;
    if (venueAddress !== undefined) event.venueAddress = venueAddress?.trim();
    if (meetingLink !== undefined) event.meetingLink = meetingLink?.trim();
    if (targetAudience) event.targetAudience = Array.isArray(targetAudience) ? targetAudience : [];
    if (maxParticipants !== undefined) event.maxParticipants = maxParticipants ? parseInt(maxParticipants) : undefined;
    if (registrationRequired !== undefined) event.registrationRequired = registrationRequired;
    if (registrationDeadline !== undefined) event.registrationDeadline = registrationDeadline ? new Date(registrationDeadline) : undefined;
    if (eligibilityCriteria !== undefined) event.eligibilityCriteria = eligibilityCriteria;
    if (tags) event.tags = Array.isArray(tags) ? tags : [];
    if (contactPerson !== undefined) event.contactPerson = contactPerson;
    if (status) event.status = status;

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update event',
      error: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
    });
  }
});

// Delete event
router.delete('/:eventId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id;
    const { eventId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    const event = await Event.findOne({ _id: eventId, collegeId: college._id });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if event has registrations
    const hasRegistrations = event.registeredStudents && event.registeredStudents.length > 0;

    if (hasRegistrations) {
      // Soft delete - just cancel the event
      event.status = 'cancelled';
      await event.save();

      res.status(200).json({
        success: true,
        message: 'Event cancelled successfully (has registrations)',
        data: { action: 'cancelled', registrations: event.registeredStudents.length }
      });
    } else {
      // Hard delete - no registrations
      await Event.findByIdAndDelete(eventId);

      res.status(200).json({
        success: true,
        message: 'Event deleted successfully',
        data: { action: 'deleted' }
      });
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete event',
      error: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
    });
  }
});

// Student event registration
router.post('/:eventId/register', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id;
    const { eventId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    // Find student
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if registration is open
    if (!event.registrationRequired) {
      return res.status(400).json({ success: false, message: 'This event does not require registration' });
    }

    if (event.status !== 'published') {
      return res.status(400).json({ success: false, message: 'Event is not open for registration' });
    }

    if (event.registrationDeadline && event.registrationDeadline < new Date()) {
      return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
    }

    if (event.startDateTime <= new Date()) {
      return res.status(400).json({ success: false, message: 'Event has already started' });
    }

    // Check if already registered
    if (event.registeredStudents.includes(student._id)) {
      return res.status(400).json({ success: false, message: 'Already registered for this event' });
    }

    // Check capacity
    if (event.maxParticipants && event.registeredStudents.length >= event.maxParticipants) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }

    // Register student
    event.registeredStudents.push(student._id);
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Successfully registered for event',
      data: {
        eventTitle: event.title,
        registrationCount: event.registeredStudents.length
      }
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to register for event',
      error: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
    });
  }
});

// Mark attendance
router.post('/:eventId/attendance', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id;
    const { eventId } = req.params;
    const { studentIds } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    const event = await Event.findOne({ _id: eventId, collegeId: college._id });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ success: false, message: 'studentIds must be an array' });
    }

    // Validate student IDs and ensure they're registered
    const validStudentIds = studentIds.filter(id => 
      Types.ObjectId.isValid(id) && event.registeredStudents.includes(new Types.ObjectId(id))
    );

    // Add to attendance (avoid duplicates)
    for (const studentId of validStudentIds) {
      if (!event.attendedStudents.includes(new Types.ObjectId(studentId))) {
        event.attendedStudents.push(new Types.ObjectId(studentId));
      }
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        attendanceCount: event.attendedStudents.length,
        totalRegistered: event.registeredStudents.length
      }
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to mark attendance',
      error: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
    });
  }
});

export default router;