import React, { useState } from 'react';
import { toast } from "./ui/sonner";

// Custom styles for tab gradient
const customTabStyles = `
  .tab-gradient-active[data-state="active"] {
    background: linear-gradient(to right, #2791FC, #0377EB) !important;
    color: white !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
  }
`;
import { 
  Mail, 
  Briefcase, 
  Building, 
  Users, 
  Clock,
  Plus,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Building2,
  Unplug,
  MapPin,
  IndianRupee,
  Calendar,
  Check,
  X,
  MessageCircle,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Eye,
  Link,
  Loader2,
  GraduationCap,
  Award,
  Phone,
  Trash2,
  Edit,
  Video,
  Monitor,
  Globe,
  Settings,
  FileText,
  Bell,
  Shield,
  Star,
  CalendarDays,
  User,
  Building as BuildingIcon,
  BookOpen,
  Download,
  Upload,
  Send
} from "lucide-react";

// ===== EXTERNAL LIBRARY IMPORTS =====
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Button } from "./ui/Button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/Card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Checkbox } from "./ui/checkbox";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Toaster } from "./ui/sonner";
import TabButtons from './ui/TabButtons';

// ===== UTILITY FUNCTIONS =====
const maskContactInfo = (status: string, realValue: string, maskedValue: string = 'XXXXXXXXX') => {
  // Only show real contact info if status is 'Connected/Partner' or if it's an active connection
  if (status === 'connected' || status === 'partner' || status === 'active') {
    return realValue;
  }
  return maskedValue;
};

// ===== TYPE DEFINITIONS =====
interface PendingItem {
  id: string;
  type: 'connection' | 'invitation' | 'interview';
  name: string;
  email: string;
  avatar?: string;
  company: string;
  requestMessage: string;
  requestDate: string;
  jobTitle?: string;
  interviewDate?: string;
  status: 'pending' | 'scheduled' | 'expired';
  sourceType?: 'sent_invitation' | 'received_invitation';
  message?: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  department: string;
  year: string;
  gpa: number;
  skills: string[];
  phone?: string;
  rollNumber?: string;
}

interface Batch {
  id: string;
  name: string;
  department: string;
  year: string;
  semester?: string;
  studentCount: number;
  averageGPA?: number;
  averageGpa?: number;
  completionRate?: number;
  skills?: string[];
  coordinator?: {
    name: string;
    email: string;
    avatar?: string;
  } | string;
  description?: string;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string;
  students?: Student[];
  isRecommended?: boolean;
}

interface RecruitmentInvitation {
  id: string;
  type?: 'job' | 'company';
  company: {
    name: string;
    logo?: string;
    industry: string;
    foundedYear?: string;
    employees?: string;
    website?: string;
  };
  jobTitle?: string;
  location: string;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
    period?: 'year' | 'month' | 'hour';
  };
  deadline?: string;
  maxStudents?: number;
  daysLeft?: number;
  status: 'pending' | 'rejected' | 'accepted' | 'students_sent' | 'under_review' | 'shortlisted' | 'interview_scheduled' | 'completed' | 'urgent' | 'expiring' | 'Available' | 'connected';
  description: string;
  selectedStudents?: Student[];
  shortlistedStudents?: Student[];
  sourceType?: 'recruiter_invitation' | 'job_application';
  recruiterName?: string;
  recruiterEmail?: string;
  recruiterPhone?: string;
  message?: string;
}

interface Company {
  id: string;
  name: string;
  logo?: string;
  industry: string;
  location: string;
  description: string;
  employeeCount: string;
  foundingYear: number;
  activeJobs: number;
  website: string;
  email?: string;
  phone?: string;
  address?: string;
  jobs?: JobOpportunity[];
}

interface Connection {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  company: string;
  partnershipType: 'recruiter' | 'company' | 'partner';
  connectionDate: string;
  hasAcceptedInvitations?: boolean;
  acceptedInvitationsCount: number;
}

interface JobOpportunity {
  id: string;
  title: string;
  company: {
    name: string;
    logo?: string;
    industry: string;
  };
  description: string;
  location: string;
  salaryRange: {
  min: number;
  max: number;
  currency: string;
  period?: 'year' | 'month' | 'hour';
}
  deadline: string;
  experienceLevel: string;
  applications: number;
  type: 'full-time' | 'part-time' | 'internship' | 'contract';
  department: string;
  status?: 'available' | 'students_selected' | 'invitation_sent' | 'approved' | 'shortlisted' | 'notified' | 'interview_scheduled';
  selectedStudents?: number;
  shortlistedStudents?: number;
  shortlistedStudentsList?: Student[];
}

interface InterviewDetails {
  connectionId: string;
  date: string;
  time: string;
  duration: string;
  type: 'online' | 'offline' | 'hybrid';
  location: string;
  meetingLink?: string;
  agenda: string;
  notes: string;
  expectedStudents: number;
  interviewers: string[];
  interviewType: string;
  requirements: string[];
  reminders: string[];
  autoConfirm: boolean;
  recordingEnabled: boolean;
  timezone: string;
  bufferTime: string;
  platformType: string;
  accessCode?: string;
}

// ===== COMPONENT DEFINITIONS =====

// EmptyState Component
function EmptyState({ 
  icon, 
  title, 
  description, 
  action 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  action?: React.ReactNode; 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-4 text-sm text-muted-foreground max-w-md">{description}</p>
      {action}
    </div>
  );
}

// MessageDialog Component
function MessageDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  actionLabel,
  onConfirm
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  placeholder: string;
  actionLabel: string;
  onConfirm: (message: string) => void;
}) {
  const [message, setMessage] = useState("");

  const handleConfirm = () => {
    onConfirm(message);
    setMessage("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setMessage("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2">
          <Label htmlFor="message">Your message</Label>
          <Textarea
            id="message"
            placeholder={placeholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!message.trim()}>
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// StudentSelectionDialog Component
function StudentSelectionDialog({
  open,
  onOpenChange,
  jobTitle,
  companyName,
  maxStudents,
  currentlySelected,
  availableBatches,
  onConfirm
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle: string;
  companyName: string;
  maxStudents: number;
  currentlySelected: Student[];
  availableBatches: Batch[];
  onConfirm: (selectedStudents: Student[], selectedBatches: Batch[]) => void;
}) {
  const [selectedStudents, setSelectedStudents] = useState<Student[]>(currentlySelected);
  const [selectedBatches, setSelectedBatches] = useState<Batch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('individual');

  // Mock student data
  const mockStudents: Student[] = [
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice.j@college.edu',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=center',
      department: 'Computer Science',
      year: 'Final Year',
      gpa: 3.8,
      skills: ['React', 'TypeScript', 'Node.js'],
      phone: '+1 (555) 123-4567'
    },
    {
      id: '2',
      name: 'Bob Smith',
      email: 'bob.s@college.edu',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=center',
      department: 'Computer Science',
      year: 'Third Year',
      gpa: 3.6,
      skills: ['React', 'JavaScript', 'CSS'],
      phone: '+1 (555) 234-5678'
    },
    {
      id: '3',
      name: 'David Wilson',
      email: 'david.w@college.edu',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=center',
      department: 'Computer Science',
      year: 'Final Year',
      gpa: 3.9,
      skills: ['React', 'TypeScript', 'Full Stack'],
      phone: '+1 (555) 345-6789'
    },
    {
      id: '4',
      name: 'Emma Davis',
      email: 'emma.d@college.edu',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=center',
      department: 'Computer Science',
      year: 'Final Year',
      gpa: 3.7,
      skills: ['JavaScript', 'Python', 'Machine Learning'],
      phone: '+1 (555) 456-7890'
    },
    {
      id: '5',
      name: 'James Brown',
      email: 'james.b@college.edu',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=center',
      department: 'Information Technology',
      year: 'Third Year',
      gpa: 3.5,
      skills: ['Java', 'Spring Boot', 'MySQL'],
      phone: '+1 (555) 567-8901'
    },
    {
      id: '6',
      name: 'Sarah Wilson',
      email: 'sarah.w@college.edu',
      avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop&crop=center',
      department: 'Computer Science',
      year: 'Final Year',
      gpa: 3.9,
      skills: ['UI/UX Design', 'React', 'Figma'],
      phone: '+1 (555) 678-9012'
    }
  ];

  const filteredStudents = mockStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleStudentToggle = (student: Student) => {
    const isSelected = selectedStudents.some(s => s.id === student.id);
    
    if (isSelected) {
      setSelectedStudents(prev => prev.filter(s => s.id !== student.id));
    } else {
      if (selectedStudents.length < maxStudents) {
        setSelectedStudents(prev => [...prev, student]);
      }
    }
  };

  const handleBatchToggle = (batch: Batch) => {
    const isSelected = selectedBatches.some(b => b.id === batch.id);
    
    if (isSelected) {
      setSelectedBatches(prev => prev.filter(b => b.id !== batch.id));
    } else {
      setSelectedBatches(prev => [...prev, batch]);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedStudents, selectedBatches);
  };

  const isStudentSelected = (studentId: string) => {
    return selectedStudents.some(s => s.id === studentId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white">
          <DialogTitle className="text-xl font-semibold text-slate-900">Select Students for {jobTitle}</DialogTitle>
          <DialogDescription className="text-slate-600">
            Choose up to {maxStudents} students to send to {companyName} for this position.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col px-6 py-4 space-y-4">
          {/* Selection Summary */}
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-blue-600" />
              <span className="font-semibold text-blue-900">
                {(() => {
                  const totalBatchStudents = selectedBatches.reduce((total, batch) => total + batch.studentCount, 0);
                  const totalSelected = selectedStudents.length + totalBatchStudents;
                  const hasIndividual = selectedStudents.length > 0;
                  const hasBatches = selectedBatches.length > 0;
                  
                  if (hasIndividual && hasBatches) {
                    return `${totalSelected} students selected (${selectedStudents.length} individual + ${totalBatchStudents} from ${selectedBatches.length} batch${selectedBatches.length !== 1 ? 'es' : ''})`;
                  } else if (hasBatches) {
                    return `${totalBatchStudents} students selected from ${selectedBatches.length} batch${selectedBatches.length !== 1 ? 'es' : ''}`;
                  } else if (hasIndividual) {
                    return `${selectedStudents.length} individual student${selectedStudents.length !== 1 ? 's' : ''} selected`;
                  } else {
                    return `0 of ${maxStudents} students selected`;
                  }
                })()}
              </span>
            </div>
            {(selectedStudents.length > 0 || selectedBatches.length > 0) && (
              <Badge className="bg-blue-600 text-white hover:bg-blue-700">
                {(() => {
                  const totalBatchStudents = selectedBatches.reduce((total, batch) => total + batch.studentCount, 0);
                  return selectedStudents.length + totalBatchStudents;
                })()} selected
              </Badge>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              placeholder="Search students by name, department, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabs for Individual vs Batch Selection */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 border border-slate-200 p-1 h-12">
              <TabsTrigger 
                value="individual" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium text-slate-600"
              >
                Individual Students
              </TabsTrigger>
              <TabsTrigger 
                value="batch" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium text-slate-600"
              >
                Batch Selection
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="flex-1 flex flex-col space-y-4">
              <div className="flex-1 overflow-y-auto space-y-3 pr-2" style={{ maxHeight: "calc(60vh - 200px)" }}>
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isStudentSelected(student.id) 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                    onClick={() => handleStudentToggle(student)}
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={isStudentSelected(student.id)}
                        disabled={!isStudentSelected(student.id) && selectedStudents.length >= maxStudents}
                        className="mt-1"
                      />
                      
                      <Avatar className="size-12 flex-shrink-0">
                        <AvatarImage src={student.avatar} alt={student.name} />
                        <AvatarFallback>
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{student.name}</h4>
                          <Badge variant="outline">GPA: {student.gpa}</Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="size-3" />
                            <span>{student.department} • {student.year}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="size-3" />
                            <span>{student.email}</span>
                          </div>
                          {student.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="size-3" />
                              <span>{student.phone}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          {student.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="batch" className="flex-1 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Select Batches</h3>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">{availableBatches.length} Available</Badge>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-2" style={{ maxHeight: "calc(60vh - 200px)" }}>
                {availableBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className={`border rounded-lg p-5 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedBatches.some(b => b.id === batch.id)
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                    onClick={() => handleBatchToggle(batch)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          checked={selectedBatches.some(b => b.id === batch.id)}
                          onChange={() => handleBatchToggle(batch)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{batch.name}</h4>
                            {batch.isRecommended && (
                              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                                <Star className="size-3 mr-1" />
                                Recommended
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-2">
                              <Users className="size-4" />
                              <span>{batch.studentCount} students</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Award className="size-4" />
                              <span>{batch.averageGPA?.toFixed(1)} avg GPA</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="size-4" />
                              <span>{batch.completionRate}% completion</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <GraduationCap className="size-4" />
                              <span>{batch.year}</span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{batch.description}</p>
                          
                          <div className="flex flex-wrap gap-1 mb-3">
                            {batch.skills?.slice(0, 5).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {batch.skills && batch.skills.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{batch.skills.length - 5} more
                              </Badge>
                            )}
                          </div>
                          
                          {typeof batch.coordinator === 'object' && batch.coordinator && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Avatar className="size-6">
                                <AvatarImage src={batch.coordinator.avatar} alt={batch.coordinator.name} />
                                <AvatarFallback className="text-xs">
                                  {batch.coordinator.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span>Coordinator: {batch.coordinator.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Selected Students Summary */}
          {selectedStudents.length > 0 && (
            <div className="border-t border-slate-200 pt-4 mt-4">
              <h4 className="font-semibold text-slate-900 mb-3">Selected Students:</h4>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-2">
                {selectedStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-3 text-sm bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <Avatar className="size-8 flex-shrink-0">
                      <AvatarImage src={student.avatar} alt={student.name} />
                      <AvatarFallback className="text-xs bg-blue-200 text-blue-800">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900">{student.name}</div>
                      <div className="text-xs text-slate-600">{student.department} • GPA: {student.gpa}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStudentToggle(student)}
                      className="ml-auto h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600 text-slate-400"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Batches Summary */}
          {selectedBatches.length > 0 && (
            <div className="border-t border-slate-200 pt-4 mt-4">
              <h4 className="font-semibold text-slate-900 mb-3">Selected Batches:</h4>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-2">
                {selectedBatches.map((batch) => (
                  <div key={batch.id} className="flex items-center gap-3 text-sm bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <GraduationCap className="size-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900">{batch.name}</div>
                        <div className="text-xs text-slate-600">{batch.studentCount} students • {batch.department}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBatchToggle(batch)}
                      className="ml-auto h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600 text-slate-400"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-300 text-slate-700 hover:bg-slate-100">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedStudents.length === 0 && selectedBatches.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
              {(() => {
                const totalBatchStudents = selectedBatches.reduce((total, batch) => total + batch.studentCount, 0);
                const totalStudents = selectedStudents.length + totalBatchStudents;
                const hasIndividual = selectedStudents.length > 0;
                const hasBatches = selectedBatches.length > 0;
                
                if (hasIndividual && hasBatches) {
                  return `Send ${totalStudents} Students (${selectedStudents.length} individual + ${selectedBatches.length} batch${selectedBatches.length !== 1 ? 'es' : ''}) to Recruiter`;
                } else if (hasBatches) {
                  return `Send ${selectedBatches.length} Batch${selectedBatches.length !== 1 ? 'es' : ''} (${totalBatchStudents} students) to Recruiter`;
                } else {
                  return `Send ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''} to Recruiter`;
                }
              })()}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// WhatsAppDialog Component
function WhatsAppDialog({
  open,
  onOpenChange,
  jobTitle,
  companyName,
  shortlistedStudents = [],
  onSend,
  onScheduleInterview
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle: string;
  companyName: string;
  shortlistedStudents?: Student[];
  onSend: (message: string, recipients: { students: string[], batches: string[] }) => void;
  onScheduleInterview?: (studentId: string, interviewDetails: any) => void;
}) {
  const [message, setMessage] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showInterviewScheduling, setShowInterviewScheduling] = useState(false);
  const [selectedStudentForInterview, setSelectedStudentForInterview] = useState<string | null>(null);
  const [interviewDetails, setInterviewDetails] = useState({
    date: "",
    time: "",
    type: "virtual",
    location: "",
    notes: ""
  });

  const defaultMessage = `🎉 Congratulations! 🎉

You have been shortlisted for the ${jobTitle} position at ${companyName}!

This is an exciting opportunity, and we're thrilled to move forward with your application. 

Next Steps:
• You will be contacted soon for the interview process
• Please keep your phone available for further communication
• Prepare for potential technical/HR discussions

Congratulations once again! 🎯

Best regards,
College Placement Team`;

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSend = () => {
    const messageToSend = message || defaultMessage;
    onSend(messageToSend, { students: selectedStudents, batches: [] });
    setMessage("");
    setSelectedStudents([]);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setMessage("");
    setSelectedStudents([]);
    setShowInterviewScheduling(false);
    setSelectedStudentForInterview(null);
    onOpenChange(false);
  };

  const handleScheduleInterviewClick = (studentId: string) => {
    setSelectedStudentForInterview(studentId);
    setShowInterviewScheduling(true);
  };

  const handleInterviewScheduleConfirm = () => {
    if (selectedStudentForInterview && onScheduleInterview) {
      onScheduleInterview(selectedStudentForInterview, interviewDetails);
      setShowInterviewScheduling(false);
      setSelectedStudentForInterview(null);
      setInterviewDetails({
        date: "",
        time: "",
        type: "virtual",
        location: "",
        notes: ""
      });
    }
  };

  React.useEffect(() => {
    if (open && !message) {
      setMessage(defaultMessage);
    }
  }, [open, message, defaultMessage]);

  const selectedStudent = shortlistedStudents.find(s => s.id === selectedStudentForInterview);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="size-5 text-green-600" />
            {showInterviewScheduling ? "Schedule Interview" : "Notify Shortlisted Students"}
          </DialogTitle>
          <DialogDescription>
            {showInterviewScheduling 
              ? `Schedule an interview for ${selectedStudent?.name} - ${jobTitle} at ${companyName}`
              : `Notify shortlisted students about the ${jobTitle} position at ${companyName} via WhatsApp.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {showInterviewScheduling ? (
            <div className="space-y-6 max-h-96 overflow-y-auto">
              <Card className="bg-gradient-to-r from-blue-50/50 to-blue-100/50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <Avatar className="size-10">
                      <AvatarImage src={selectedStudent?.avatar} alt={selectedStudent?.name} />
                      <AvatarFallback>
                        {selectedStudent?.name?.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span>{selectedStudent?.name}</span>
                      <p className="text-sm text-muted-foreground font-normal">
                        {selectedStudent?.department} • {selectedStudent?.year}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interview-date">Interview Date</Label>
                  <Input
                    id="interview-date"
                    type="date"
                    value={interviewDetails.date}
                    onChange={(e) => setInterviewDetails(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interview-time">Interview Time</Label>
                  <Input
                    id="interview-time"
                    type="time"
                    value={interviewDetails.time}
                    onChange={(e) => setInterviewDetails(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interview-type">Interview Type</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="interviewType"
                      value="virtual"
                      checked={interviewDetails.type === "virtual"}
                      onChange={(e) => setInterviewDetails(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-4 h-4 text-primary"
                    />
                    <span>Virtual</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="interviewType"
                      value="in-person"
                      checked={interviewDetails.type === "in-person"}
                      onChange={(e) => setInterviewDetails(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-4 h-4 text-primary"
                    />
                    <span>In-Person</span>
                  </label>
                </div>
              </div>

              {interviewDetails.type === "in-person" && (
                <div className="space-y-2">
                  <Label htmlFor="interview-location">Location</Label>
                  <Input
                    id="interview-location"
                    placeholder="Enter interview location"
                    value={interviewDetails.location}
                    onChange={(e) => setInterviewDetails(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="interview-notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="interview-notes"
                  placeholder="Any additional information for the candidate..."
                  value={interviewDetails.notes}
                  onChange={(e) => setInterviewDetails(prev => ({ ...prev, notes: e.target.value }))}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          ) : (
            <Tabs defaultValue="recipients" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recipients">Select Recipients</TabsTrigger>
                <TabsTrigger value="message">Compose Message</TabsTrigger>
              </TabsList>

              <TabsContent value="recipients" className="mt-4 space-y-4">
                <div className="max-h-96 overflow-y-auto">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User className="size-4" />
                    Shortlisted Students ({shortlistedStudents.length})
                  </h4>
                  
                  {shortlistedStudents.length > 0 ? (
                    <div className="space-y-3">
                      {shortlistedStudents.map((student) => (
                        <Card key={student.id} className="p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={`student-${student.id}`}
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={() => handleStudentToggle(student.id)}
                            />
                            <Avatar className="size-12">
                              <AvatarImage src={student.avatar} alt={student.name} />
                              <AvatarFallback>
                                {student.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <Label htmlFor={`student-${student.id}`} className="font-medium text-base cursor-pointer">
                                {student.name}
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                {student.department} • {student.year} • GPA: {student.gpa}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {student.skills.slice(0, 3).map(skill => (
                                  <Badge key={skill} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleScheduleInterviewClick(student.id)}
                                className="text-xs"
                              >
                                <Calendar className="size-3 mr-1" />
                                Schedule Interview
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="size-12 mx-auto mb-2 opacity-30" />
                      <p>No shortlisted students available</p>
                      <p className="text-sm">Students will appear here after recruiter shortlisting</p>
                    </div>
                  )}
                </div>

                {selectedStudents.length > 0 && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">
                      Ready to notify: {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {selectedStudents.length} shortlisted students selected
                    </Badge>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="message" className="mt-4">
                <div className="space-y-4">
                  <Label htmlFor="whatsapp-message">Congratulatory Message</Label>
                  <Textarea
                    id="whatsapp-message"
                    placeholder="Enter your WhatsApp congratulatory message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground">
                    🎉 Tip: This is a congratulatory message for shortlisted students. 
                    Keep it positive and encouraging!
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {showInterviewScheduling ? (
              interviewDetails.date && interviewDetails.time ? (
                <>Ready to schedule interview</>
              ) : (
                <>Fill in interview details to continue</>
              )
            ) : (
              selectedStudents.length > 0 ? (
                <>Ready to send to {selectedStudents.length} shortlisted students</>
              ) : (
                <>Select shortlisted students to continue</>
              )
            )}
          </div>
          <div className="flex gap-2">
            {showInterviewScheduling && (
              <Button 
                variant="outline" 
                onClick={() => setShowInterviewScheduling(false)}
              >
                Back to Students
              </Button>
            )}
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {showInterviewScheduling ? (
              <Button 
                onClick={handleInterviewScheduleConfirm}
                disabled={!interviewDetails.date || !interviewDetails.time}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CalendarDays className="size-4 mr-2" />
                Schedule Interview
              </Button>
            ) : (
              <Button 
                onClick={handleSend} 
                disabled={selectedStudents.length === 0 || !message.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="size-4 mr-2" />
                Send WhatsApp Messages
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// CompanyDetailsDialog Component
function CompanyDetailsDialog({
  open,
  onOpenChange,
  company,
  context = 'send_invitations',
  onAcceptInvitation,
  onWithdraw
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  context?: 'send_invitations' | 'invitations' | 'status';
  onAcceptInvitation?: (companyId: string) => void;
  onWithdraw?: (companyId: string) => void;
}) {
  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-[50vw] max-h-[90vh] overflow-y-auto rounded-2xl p-6 bg-white relative shadow-xl">
  

    {/* Header with logo + name */}
    <div className="flex items-start gap-4 mb-6">
      <div className="size-16 bg-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0">
        {company.logo ? (
          <img
            src={company.logo}
            alt={company.name}
            className="size-12 rounded-xl object-cover"
          />
        ) : (
          <div className="size-10 bg-blue-600 rounded-full flex items-center justify-center">
            <Building className="size-6 text-white" />
          </div>
        )}
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{company.name}</h2>
        <p className="text-gray-500 text-sm font-medium">{company.industry}</p>
      </div>
    </div>

    {/* Stats row */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
  {/* Founded */}
  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col items-center text-center shadow-sm">
    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
      <Calendar className="w-4 h-4 text-gray-400" />
      <span>Founded</span>
    </div>
    <div className="text-blue-600 font-semibold text-sm">{company.foundingYear}</div>
  </div>

  {/* Employees */}
  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col items-center text-center shadow-sm">
    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
      <Users className="w-4 h-4 text-gray-400" />
      <span>Employees</span>
    </div>
    <div className="text-blue-600 font-semibold text-sm">
      {company.employeeCount ?? 'Contact for details'}
    </div>
  </div>

  {/* Location */}
  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col items-center text-center shadow-sm">
    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
      <MapPin className="w-4 h-4 text-gray-400" />
      <span>Location</span>
    </div>
    <div className="text-blue-600 font-semibold text-sm">{company.location}</div>
  </div>

  {/* Active Jobs */}
  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col items-center text-center shadow-sm">
    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
      <Briefcase className="w-4 h-4 text-gray-400" />
      <span>Active Jobs</span>
    </div>
    <div className="text-blue-600 font-semibold text-sm">
      {String(company.activeJobs ?? 0).padStart(2, '0')}
    </div>
  </div>
</div>


    {/* About */}
    <div className="mb-8">
      <h3 className="text-lg font-bold text-gray-900 mb-2">About {company.name}</h3>
      <p className="text-gray-600 text-sm mb-4">{company.description}</p>

      <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-2 text-sm">
        <Globe className="size-5 text-blue-600" />
        <span className="text-gray-700">Website:</span>
        <a href={company.website} target="_blank" className="text-blue-600 hover:underline flex items-center gap-1">
          {company.website}
          <Link className="size-4" />
        </a>
      </div>
    </div>

{/* Active Job Openings */}
<div className="mb-8">
  <h3 className="text-lg font-bold text-gray-900 mb-4">Active Job Openings</h3>

  {company.jobs?.length ? (
    <div className="space-y-4">
      {company.jobs.map((job, i) => (
        <div
          key={i}
          className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Title + Badge */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">{job.title}</h4>
            <Badge className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
              {job.type === "full-time"
                ? "Full-Time"
                : job.type === "internship"
                ? "Internship"
                : job.type === "part-time"
                ? "Part-Time"
                : "Contract"}
            </Badge>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            {job.description}
          </p>

          {/* Meta info grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{job.location}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <IndianRupee className="w-4 h-4 text-gray-400" />
              <span>
                {job.salaryRange.min / 100000}L - {job.salaryRange.max / 100000}L
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Apply by {job.deadline}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <Award className="w-4 h-4 text-gray-400" />
              <span>{job.experienceLevel}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-6 text-gray-500 border border-dashed border-gray-200 rounded-xl">
      <Briefcase className="w-10 h-10 mx-auto mb-2 text-gray-300" />
      <p>No active job openings at this time.</p>
    </div>
  )}
</div>


    {/* Contact Info */}
    <div className="mb-8">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
      <div className=" bg-gray-50 space-y-3 text-sm border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        {company.email && (
          <p className="flex items-center gap-2">
            <Mail className="size-4 text-gray-400" /> {company.email}
          </p>
        )}
        {company.phone && (
          <p className="flex items-center gap-2">
            <Phone className="size-4 text-gray-400" /> {company.phone}
          </p>
        )}
        {company.address && (
          <p className="flex items-center gap-2">
            <MapPin className="size-4 text-gray-400" /> {company.address}
          </p>
        )}
      </div>
    </div>

    {/* Action buttons */}
    <div className="flex justify-center gap-4 pt-6 border-t">
      {context === 'send_invitations' && (
        <>
          <Button
            variant="outline"
            className="px-8 py-2 border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4 mr-1" /> Decline
          </Button>
          <Button className="px-8 py-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg shadow hover:opacity-90">
            <Check className="size-3 mr-1" /> Send Invitation
          </Button>
        </>
      )}
      
      {context === 'invitations' && (
        <>
          <Button
            variant="outline"
            className="px-8 py-2 border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4 mr-1" /> Decline
          </Button>
          <Button 
            className="px-8 py-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg shadow hover:opacity-90"
            onClick={() => {
              if (onAcceptInvitation && company) {
                onAcceptInvitation(company.id);
              }
              onOpenChange(false);
            }}
          >
            <Check className="size-4 mr-1" /> Accept Invitation
          </Button>
        </>
      )}
      
      {context === 'status' && (
        <Button
          variant="outline"
          className="px-8 py-2 border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
          onClick={() => {
            if (onWithdraw && company) {
              onWithdraw(company.id);
            }
            onOpenChange(false);
          }}
        >
          <X className="size-4 mr-1" /> Withdraw
        </Button>
      )}
    </div>
  </DialogContent>
</Dialog>

  );
}

// InterviewSchedulingDialog Component
function InterviewSchedulingDialog({
  open,
  onOpenChange,
  connectionName,
  jobTitle,
  companyName,
  shortlistedStudents,
  onConfirm
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectionName: string;
  jobTitle?: string;
  companyName?: string;
  shortlistedStudents?: Student[];
  onConfirm: (interviewDetails: InterviewDetails) => void;
}) {
  const [interviewDetails, setInterviewDetails] = useState<InterviewDetails>({
    connectionId: '',
    date: '',
    time: '',
    duration: '60',
    type: 'online',
    location: '',
    meetingLink: '',
    agenda: '',
    notes: '',
    expectedStudents: shortlistedStudents?.length || 1,
    interviewers: [''],
    interviewType: 'General Interview',
    requirements: [''],
    reminders: ['1 day before', '1 hour before'],
    autoConfirm: false,
    recordingEnabled: false,
    timezone: 'UTC',
    bufferTime: '15',
    platformType: 'Microsoft Teams',
    accessCode: ''
  });

  const handleInputChange = (field: keyof InterviewDetails, value: any) => {
    setInterviewDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInputChange = (field: 'interviewers' | 'requirements', index: number, value: string) => {
    setInterviewDetails(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'interviewers' | 'requirements') => {
    setInterviewDetails(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'interviewers' | 'requirements', index: number) => {
    setInterviewDetails(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleConfirm = () => {
    onConfirm(interviewDetails);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setInterviewDetails({
      connectionId: '',
      date: '',
      time: '',
      duration: '60',
      type: 'online',
      location: '',
      meetingLink: '',
      agenda: '',
      notes: '',
      expectedStudents: 1,
      interviewers: [''],
      interviewType: 'General Interview',
      requirements: [''],
      reminders: ['1 day before', '1 hour before'],
      autoConfirm: false,
      recordingEnabled: false,
      timezone: 'UTC',
      bufferTime: '15',
      platformType: 'Microsoft Teams',
      accessCode: ''
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <CalendarDays className="size-6 text-blue-600" />
            <div>
              <div className="text-xl font-bold">Schedule Interview</div>
              <div className="text-sm text-muted-foreground">
                {jobTitle ? `${jobTitle} at ${companyName}` : `with ${connectionName}`}
              </div>
            </div>
          </DialogTitle>
          {shortlistedStudents && shortlistedStudents.length > 0 && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Shortlisted Students ({shortlistedStudents.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {shortlistedStudents.map((student) => (
                  <Badge key={student.id} variant="secondary" className="bg-blue-50 text-blue-800">
                    {student.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interview-date">Interview Date *</Label>
              <Input
                id="interview-date"
                type="date"
                value={interviewDetails.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="interview-time">Interview Time *</Label>
              <Input
                id="interview-time"
                type="time"
                value={interviewDetails.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select value={interviewDetails.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="interview-type-select">Interview Type</Label>
              <Select value={interviewDetails.type} onValueChange={(value: 'online' | 'offline' | 'hybrid') => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">
                    <div className="flex items-center gap-2">
                      <Monitor className="size-4" />
                      <span>Online</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="offline">
                    <div className="flex items-center gap-2">
                      <Building className="size-4" />
                      <span>In-Person</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="hybrid">
                    <div className="flex items-center gap-2">
                      <Users className="size-4" />
                      <span>Hybrid</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location/Meeting Details */}
          {interviewDetails.type === 'online' || interviewDetails.type === 'hybrid' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={interviewDetails.platformType} onValueChange={(value) => handleInputChange('platformType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                    <SelectItem value="Zoom">Zoom</SelectItem>
                    <SelectItem value="Google Meet">Google Meet</SelectItem>
                    <SelectItem value="WebEx">WebEx</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="meeting-link">Meeting Link</Label>
                <Input
                  id="meeting-link"
                  placeholder="https://teams.microsoft.com/..."
                  value={interviewDetails.meetingLink}
                  onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="access-code">Access Code (if required)</Label>
                <Input
                  id="access-code"
                  placeholder="Enter meeting access code"
                  value={interviewDetails.accessCode}
                  onChange={(e) => handleInputChange('accessCode', e.target.value)}
                />
              </div>
            </div>
          ) : null}

          {interviewDetails.type === 'offline' || interviewDetails.type === 'hybrid' ? (
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Conference Room A, 123 Main St, Building 2"
                value={interviewDetails.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>
          ) : null}

          {/* Interview Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agenda">Interview Agenda</Label>
              <Textarea
                id="agenda"
                placeholder="1. Introduction (10 min)&#10;2. Technical Questions (30 min)&#10;3. Q&A Session (15 min)&#10;4. Next Steps (5 min)"
                value={interviewDetails.agenda}
                onChange={(e) => handleInputChange('agenda', e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information for the interviewers or candidates..."
                value={interviewDetails.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>
          </div>

          {/* Interviewers */}
          <div className="space-y-3">
            <Label>Interviewers</Label>
            {interviewDetails.interviewers.map((interviewer, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="Interviewer name"
                  value={interviewer}
                  onChange={(e) => handleArrayInputChange('interviewers', index, e.target.value)}
                />
                {interviewDetails.interviewers.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('interviewers', index)}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => addArrayItem('interviewers')}
              className="w-full"
            >
              <Plus className="size-4 mr-2" />
              Add Interviewer
            </Button>
          </div>

          {/* Additional Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected-students">Expected Students</Label>
              <Input
                id="expected-students"
                type="number"
                min="1"
                value={interviewDetails.expectedStudents}
                onChange={(e) => handleInputChange('expectedStudents', parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="buffer-time">Buffer Time (minutes)</Label>
              <Select value={interviewDetails.bufferTime} onValueChange={(value) => handleInputChange('bufferTime', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No buffer</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-confirm"
                checked={interviewDetails.autoConfirm}
                onCheckedChange={(checked) => handleInputChange('autoConfirm', checked)}
              />
              <Label htmlFor="auto-confirm">Auto-confirm student attendance</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recording"
                checked={interviewDetails.recordingEnabled}
                onCheckedChange={(checked) => handleInputChange('recordingEnabled', checked)}
              />
              <Label htmlFor="recording">Enable interview recording (with consent)</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!interviewDetails.date || !interviewDetails.time}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <CalendarDays className="size-4 mr-2" />
            Schedule Interview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// RecruitmentInvitation Component
function RecruitmentInvitation({
  id,
  type,
  company,
  jobTitle,
  location,
  salaryRange,
  deadline,
  maxStudents,
  daysLeft,
  status,
  description,
  selectedStudents = [],
  shortlistedStudents = [],
  sourceType,
  recruiterName,
  recruiterEmail,
  recruiterPhone,
  message,
  onAccept,
  onDecline,
  onSendStudents,
  onViewCompany,
  onSendConnection,
  onNotifyShortlisted
}: RecruitmentInvitation & {
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onSendStudents: (id: string) => void;
  onViewCompany: (id: string) => void;
  onSendConnection: (id: string) => void;
  onNotifyShortlisted: (id: string) => void;
}) {
  const [showStudents, setShowStudents] = useState(false);

  const getStatusColor = () => {
    switch (status) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'expiring':
        return 'bg-amber-500 text-white';
      case 'pending':
        return 'bg-[#FF8C11]/10 text-[#FF8C11] border border-[#FF8C11] hover:bg-[#FF8C11]/20';
      default:
        return 'bg-grey-500 text-white';
    }
  };

  const getUrgencyColor = () => {
    return 'bg-[#7E6DFE]/10 text-[#7E6DFE] border border-[#7E6DFE]';
  };

  const getStatINRisplay = () => {
    switch (status) {
      case 'pending':
        return { text: 'New Invitation', color: 'bg-[#0377EB] text-white', icon: Clock };
      case 'rejected':
        return { text: 'Rejected', color: 'bg-red-500 text-white', icon: X };
      case 'accepted':
        // This case is no longer needed as invitations go directly to Connected/Partner status
        return { text: 'Partnership Established', color: 'bg-green-500 text-white', icon: Check };
      case 'students_sent':
        return { text: 'Students Sent', color: 'bg-blue-500 text-white', icon: UserPlus };
      case 'under_review':
        return { text: 'Under Review', color: 'bg-yellow-500 text-black', icon: Loader2 };
      case 'shortlisted':
        return { text: 'Students Shortlisted', color: 'bg-emerald-500 text-white', icon: Check };
      case 'interview_scheduled':
        return { text: 'Interview Scheduled', color: 'bg-purple-500 text-white', icon: Calendar };
      case 'completed':
        return { text: 'Process Complete', color: 'bg-gray-500 text-white', icon: Check };
      case 'urgent':
        return { text: 'Urgent Deadline', color: 'bg-red-500 text-white', icon: AlertCircle };
      case 'expiring':
        return { text: 'Expiring Soon', color: 'bg-amber-500 text-white', icon: Clock };
      default:
        return { text: 'Status', color: 'bg-gray-500 text-white', icon: Clock };
    }
  };

  const renderActionButton = () => {
    switch (status) {
      case 'pending':
      case 'Available':
        return (
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => onAccept(id)}
              className="bg-gradient-to-r from-[#44BF06] to-[#2FA400] text-white rounded-lg shadow hover:opacity-110 px-8 py-3 whitespace-nowrap min-w-fit"
              size="lg"
            >
              <Check className="size-4 mr-2" />
              Accept Invitation
            </Button>
            <Button
              onClick={() => onDecline(id)}
              variant="outline"
              className="border-red-500 text-red-600 rounded-lg shadow hover:bg-red-50 px-8 py-3 whitespace-nowrap min-w-fit"
              size="lg"
            >
              <X className="size-4 mr-2" />
              Decline Invitation
            </Button>
          </div>
        );
      
      case 'accepted':
        // This case is no longer needed as invitations go directly to Connected/Partner status
        // Keeping for reference but should not be reached
        return null;
      
      case 'students_sent':
        return (
          <Button
            disabled
            variant="outline"
            className="px-6 py-3 cursor-not-allowed opacity-60"
            size="lg"
          >
            <Loader2 className="size-4 mr-2 animate-spin" />
            Students Sent - Waiting for Review
          </Button>
        );
      
      case 'rejected':
        return (
          <Button
            disabled
            variant="outline"
            className="px-6 py-3 cursor-not-allowed opacity-60 border-red-200 text-red-600"
            size="lg"
          >
            <X className="size-4 mr-2" />
            Invitation Rejected
          </Button>
        );
      
      case 'under_review':
        return (
          <Button
            disabled
            variant="outline"
            className="px-6 py-3 cursor-not-allowed opacity-60"
            size="lg"
          >
            <Loader2 className="size-4 mr-2 animate-spin" />
            Under Review by Recruiter
          </Button>
        );
      
      case 'interview_scheduled':
        return (
          <Button
            disabled
            variant="outline"
            className="px-6 py-3 cursor-not-allowed opacity-60 border-purple-200 text-purple-600"
            size="lg"
          >
            <Calendar className="size-4 mr-2" />
            Interview Scheduled
          </Button>
        );
      
      case 'completed':
        return (
          <Button
            disabled
            variant="outline"
            className="px-6 py-3 cursor-not-allowed opacity-60"
            size="lg"
          >
            <Check className="size-4 mr-2" />
            Process Completed
          </Button>
        );
      
      case 'urgent':
      case 'expiring':
        return (
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => onAccept(id)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 whitespace-nowrap min-w-fit"
              size="lg"
            >
              <Check className="size-4 mr-2" />
              Accept Invitation
            </Button>
            <Button
              onClick={() => onDecline(id)}
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50 px-8 py-3 whitespace-nowrap min-w-fit"
              size="lg"
            >
              <X className="size-4 mr-2" />
              Decline Invitations
            </Button>
          </div>
        );
      
      default:
        return (
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => onAccept(id)}
              className="bg-gradient-to-r from-[#44BF06] to-[#2FA400] text-white rounded-lg shadow hover:opacity-110 px-8 py-3 whitespace-nowrap min-w-fit"
              size="lg"
            >
              <Check className="size-4 mr-2" />
              Accept Invitation
            </Button>
            <Button
              onClick={() => onDecline(id)}
              variant="outline"
              className="border-red-500 text-red-600 rounded-lg shadow hover:bg-red-50 px-8 py-3 whitespace-nowrap min-w-fit"
              size="lg"
            >
              <X className="size-4 mr-2" />
              Decline Invitations
            </Button>
          </div>
        );
    }
  };

  const statusInfo = getStatINRisplay();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 border border-slate-200 hover:border-slate-300 bg-white border-l-4 border-l-blue-500">
      <div className="flex items-center gap-6">
        {/* Left Section: Avatar + Company Info */}
        <div className="flex items-start gap-4 flex-1">
          <Avatar className="size-16 flex-shrink-0 rounded-full">
            <AvatarImage src={company.logo} alt={company.name} />
            <AvatarFallback className="bg-purple-200 text-purple-700 font-semibold rounded-full">{company.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div>
            {type === 'job' ? (
              // Job Invitation Layout (matching first two UI designs)
              <>
                {/* Job Title with badges */}
                <div className="mb-2">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-xl text-slate-900">{jobTitle}</h3>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-blue-100 text-blue-600 border border-blue-200 hover:bg-blue-100">
                        {status === 'Available' ? 'Available' : 'Available'}
                      </Badge>
                      {daysLeft && (
                        <Badge className="bg-purple-100 text-purple-600 border border-purple-200 hover:bg-purple-100">
                          {daysLeft} days left
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm">{company.name}</p>
                </div>
                
                {/* Job Details Row */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                  <div className="flex items-center gap-1">
                    <MapPin className="size-4 text-gray-400" />
                    <span>{location}</span>
                  </div>
                  <span>₹{salaryRange?.min.toLocaleString()}/month</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="size-4 text-gray-400" />
                    <span>{deadline}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UserPlus className="size-4 text-gray-400" />
                    <span>{maxStudents} students max</span>
                  </div>
                </div>
                
                {/* About job - Horizontal layout */}
                <div className="flex items-start mb-4">
                  <h4 className="font-medium text-gray-900 min-w-max mr-4">About job:</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {description || 'Join our dynamic engineering team to work on cutting-edge web applications hands-on experience with modern tech stack.'}
                  </p>
                </div>


              </>
            ) : (
              // Company Invitation Layout (matching designs 1, 4, and 5)
              <>
                {/* Company Name with inline details */}
                <div className="mb-2">
                  <div className="flex items-center gap-4 mb-1">
                    <h3 className="font-bold text-xl text-slate-900">{company.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Founded Year: <span className="font-medium">{company.foundedYear || '2015'}</span></span>
                      <span className="mx-2">Employees: <span className="font-medium">{company.employees || '1-10'}</span></span>
                      <div className="flex items-center gap-1">
                        <MapPin className="size-4 text-gray-400" />
                        <span>{location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-gray-500 text-sm">{company.industry}</p>
                    <div className="text-sm text-gray-600">
                      <span>Website: </span>
                      <span>{company.website || 'www.xyzcompany.com'}</span>
                    </div>
                  </div>
                </div>
                
                {/* About the Company - Horizontal layout */}
                <div className="flex items-start" style={{ marginTop: '20px' }}>
                  <h4 className="font-medium text-gray-900 min-w-max mr-4">About the Company:</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {description || 'lorem ipsum kirin demo job description software developer intern in fintech position dummy text even writing...'}
                  </p>
                </div>


              </>
            )}

            
            {/* Hiring Manager - With 51px spacing */}
            <div style={{ marginTop: '20px' }}>
              <h4 className="font-medium text-gray-900 mb-1">Hiring Manager</h4>
              {/* Hiring Manager details in horizontal line */}
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium text-gray-900">{maskContactInfo(status, recruiterName || 'Ms. Priya Sharma', 'Ms. XXXXXXXXX')}</span>
                <span className="flex items-center gap-1 text-blue-600">
                  📞 {maskContactInfo(status, recruiterPhone || '+91 98765-43210', '+91 XXXXXXXXXX')}
                </span>
                <span className="flex items-center gap-1 text-blue-600">
                  📧 {maskContactInfo(status, recruiterEmail || 'recruiter@company.com', 'XXXXXXXXX@bit.edu')}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Section: Action Buttons */}
        <div className="flex flex-col gap-3 ml-auto self-center">
          {/* Main action button */}
          {renderActionButton()}
          
          {/* Secondary actions */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => onViewCompany(id)}
            className="border-[#1383F3] text-[#1383F3] hover:bg-[#1383F3] hover:text-white rounded-lg px-6 py-2.5 font-medium flex items-center justify-center whitespace-nowrap"
          >
            <Eye className="size-4 mr-2" />
            <span>View Company</span>
          </Button>
        </div>

        {/* Student information display - moved to bottom if needed */}
        {(selectedStudents.length > 0 || shortlistedStudents.length > 0) && (
          <div className="mt-4 space-y-2 w-full">
            {selectedStudents.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <UserPlus className="size-4 text-blue-500" />
                <span className="text-muted-foreground">
                  {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} sent to recruiter
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStudents(!showStudents)}
                  className="h-6 px-2"
                >
                  {showStudents ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </Button>
              </div>
            )}
            
            {shortlistedStudents.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Check className="size-4 text-green-500" />
                <span className="text-green-600 font-medium">
                  {shortlistedStudents.length} student{shortlistedStudents.length > 1 ? 's' : ''} shortlisted by recruiter
                </span>
              </div>
            )}
            
            {/* Student list (collapsible) */}
            {showStudents && selectedStudents.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 mt-2">
                <h5 className="font-medium text-sm">Students Sent:</h5>
                {selectedStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-3 text-sm">
                    <Avatar className="size-8">
                      <AvatarImage src={student.avatar} alt={student.name} />
                      <AvatarFallback className="text-xs">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{student.name}</span>
                        {shortlistedStudents.some(s => s.id === student.id) && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                            ✓ Shortlisted
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {student.department} • {student.year} • GPA: {student.gpa}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// JobOpportunity Component
function JobOpportunity({
  id,
  title,
  company,
  description,
  location,
  salaryRange,
  deadline,
  experienceLevel,
  applications,
  type,
  department,
  status = 'available',
  selectedStudents = 0,
  shortlistedStudents = 0,
  onRequestInvitation,
  onSendToRecruiter,
  onNotifyStudents,
  onScheduleInterview,
  onViewCompany
}: JobOpportunity & {
  onRequestInvitation: (id: string) => void;
  onSendToRecruiter: (id: string) => void;
  onNotifyStudents: (id: string) => void;
  onScheduleInterview: (id: string) => void;
  onViewCompany: (id: string) => void;
}) {
  const getTypeColor = () => {
    switch (type) {
      case 'full-time':
        return 'bg-green-100 text-green-800';
      case 'part-time':
        return 'bg-blue-100 text-blue-800';
      case 'internship':
        return 'bg-blue-100 text-blue-800';
      case 'contract':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusInfo = () => {
    // For invitation cards, we'll show "Available" status with department-based colors
    const isAvailable = status === 'available' || status === 'students_selected' || status === 'invitation_sent' || status === 'approved';
    
    if (isAvailable) {
      // All available cards use the same Available color scheme
      return { 
        text: 'Available', 
        color: 'border-[#0377EB] bg-[#2791FC]/10 text-[#0377EB]',
        cardBorder: 'border-[#0377EB]',
        cardBg: 'bg-[#2791FC]/5',
        action: 'Send Invitation' 
      };
    }
    
    // For other statuses, keep simpler styling
    switch (status) {
      case 'shortlisted':
        return { text: 'Students Shortlisted', color: 'bg-emerald-500 text-white', cardBorder: 'border-emerald-200', cardBg: 'bg-emerald-50/30', action: 'Schedule Interview' };
      case 'notified':
        return { text: 'Students Notified', color: 'bg-indigo-500 text-white', cardBorder: 'border-indigo-200', cardBg: 'bg-indigo-50/30', action: 'Schedule Interview' };
      case 'interview_scheduled':
        return { text: 'Interview Scheduled', color: 'bg-pink-500 text-white', cardBorder: 'border-pink-200', cardBg: 'bg-pink-50/30', action: 'Completed' };
      default:
        return { text: 'Available', color: 'border-[#0377EB] bg-[#2791FC]/10 text-[#0377EB]', cardBorder: 'border-[#0377EB]', cardBg: 'bg-[#2791FC]/5', action: 'Send Invitation' };
    }
  };

  const renderActionButton = () => {
    const statusInfo = getStatusInfo();
    
    // For invitation cards, we simplify to mainly "Send Invitation" action
    const isAvailable = status === 'available' || status === 'students_selected' || status === 'invitation_sent' || status === 'approved';
    
    if (isAvailable) {
      return (
        <Button 
          onClick={() => onRequestInvitation(id)}
          className="bg-gradient-to-r from-[#0478EC] to-[#248FFB] text-white rounded-lg shadow-sm px-6 py-2.5 font-medium hover:opacity-90 flex items-center whitespace-nowrap"
          size="lg"
        >
          <Send className="size-4 mr-2 text-white" />
          <span>Send Invitation</span>
        </Button>
      );
    }
    
    // Keep existing functionality for other statuses
    switch (status) {
      case 'shortlisted':
        return (
          <Button 
            onClick={() => onScheduleInterview(id)}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 whitespace-nowrap min-w-fit"
            size="lg"
          >
            <Calendar className="size-4 mr-2" />
            Schedule Interview
          </Button>
        );
      case 'notified':
        return (
          <Button 
            onClick={() => onScheduleInterview(id)}
            className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 whitespace-nowrap min-w-fit"
            size="lg"
          >
            <Calendar className="size-4 mr-2" />
            Schedule Interview
          </Button>
        );
      case 'interview_scheduled':
        return (
          <Button 
            disabled
            variant="outline"
            className="cursor-not-allowed opacity-60 px-6 py-3 whitespace-nowrap min-w-fit"
            size="lg"
          >
            <Check className="size-4 mr-2" />
            Completed
          </Button>
        );
      default:
        return (
          <Button 
            onClick={() => onRequestInvitation(id)}
            className="bg-gradient-to-r from-[#0478EC] to-[#248FFB] text-white rounded-lg shadow-sm px-6 py-2.5 font-medium hover:opacity-90 flex items-center whitespace-nowrap min-w-fit"
            size="lg"
          >
            <Send className="size-4 mr-2 text-white" />
            <span>Send Invitation</span>
          </Button>
        );
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 border border-slate-200 hover:border-slate-300 bg-white border-l-4 border-l-blue-500">
      <div className="flex items-center gap-6">
        {/* Left Section: Avatar + Job Info */}
        <div className="flex items-start gap-4 flex-1">
          <Avatar className="size-16 flex-shrink-0 rounded-full">
            <AvatarImage src={company.logo} alt={company.name} />
            <AvatarFallback className="bg-purple-200 text-purple-700 font-semibold rounded-full">{company.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div>
            {/* Job Title with badges */}
            <div className="mb-2">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-bold text-xl text-slate-900">{title}</h3>
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-100 text-blue-600 border border-blue-200 hover:bg-blue-100">
                    Available
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-600 border border-purple-200 hover:bg-purple-100">
                    3 days left
                  </Badge>
                </div>
              </div>
              <p className="text-gray-500 text-sm">{company.name}</p>
            </div>
            
            {/* Job Details Row */}
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center gap-1">
                <MapPin className="size-4 text-gray-400" />
                <span>{location}</span>
              </div>
              <span>₹{salaryRange?.min?.toLocaleString() || '15,000'}/month</span>
              <div className="flex items-center gap-1">
                <Calendar className="size-4 text-gray-400" />
                <span>{deadline}</span>
              </div>
              <div className="flex items-center gap-1">
                <UserPlus className="size-4 text-gray-400" />
                <span>3 students max</span>
              </div>
            </div>
            
            {/* About job - Horizontal layout */}
            <div className="flex items-start">
              <h4 className="font-medium text-gray-900 min-w-max mr-4">About job:</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {description || 'Join our dynamic engineering team to work on cutting-edge web applications hands-on experience with modern tech stack.'}
              </p>
            </div>
            
            {/* Hiring Manager - With 51px spacing */}
            <div style={{ marginTop: '20px' }}>
              <h4 className="font-medium text-gray-900 mb-1">Hiring Manager</h4>
              {/* Hiring Manager details in horizontal line */}
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium text-gray-900">{maskContactInfo(status, 'Ms. Anjali Rao', 'Ms. XXXXXXXXX')}</span>
                <span className="flex items-center gap-1 text-blue-600">
                  📞 {maskContactInfo(status, '+91 97654-32108', '+91 XXXXXXXXXX')}
                </span>
                <span className="flex items-center gap-1 text-blue-600">
                  📧 {maskContactInfo(status, 'anjali.rao@company.com', 'XXXXXXXXX@bit.edu')}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Section: Action Buttons */}
        <div className="flex flex-col gap-3 ml-auto self-center">
          {/* Main action button */}
          {renderActionButton()}
          
          {/* Secondary actions */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => onViewCompany(id)}
            className="border-[#1383F3] text-[#1383F3] hover:bg-[#1383F3] hover:text-white rounded-lg px-6 py-2.5 font-medium flex items-center justify-center whitespace-nowrap"
          >
            <Eye className="size-4 mr-2" />
            <span>View Company</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

// CompanyCard Component
function CompanyCard({
  id,
  name,
  logo,
  industry,
  location,
  description,
  employeeCount,
  foundingYear,
  activeJobs,
  website,
  onConnect,
  onViewDetails
}: Company & {
  onConnect: (id: string) => void;  // This will handle "Send Invitation" action
  onViewDetails: (id: string) => void;
}) {
  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 border border-slate-200 hover:border-slate-300 bg-white border-l-4 border-l-blue-500">
      <div className="flex items-center gap-6">
        {/* Left Section: Avatar + Company Info */}
        <div className="flex items-start gap-4 flex-1">
          <Avatar className="size-16 flex-shrink-0 rounded-full">
            <AvatarImage src={logo} alt={name} />
            <AvatarFallback className="bg-purple-200 text-purple-700 font-semibold rounded-full">{name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div>
            {/* Company Name with inline details */}
            <div className="mb-2">
              <div className="flex items-center gap-4 mb-1">
                <h3 className="font-bold text-xl text-slate-900">{name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Founded Year: <span className="font-medium">{foundingYear}</span></span>
                  <span className="mx-2">Employees: <span className="font-medium">{employeeCount}</span></span>
                  <div className="flex items-center gap-1">
                    <MapPin className="size-4 text-gray-400" />
                    <span>{location}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-gray-500 text-sm">{industry}</p>
                <div className="text-sm text-gray-600">
                  <span>Website: </span>
                  <span>{website}</span>
                </div>
              </div>
            </div>
            
            {/* About the Company - Horizontal layout */}
            <div className="flex items-start" style={{ marginTop: '20px' }}>
              <h4 className="font-medium text-black-400 min-w-max mr-4" style={{marginBottom: 0}}>About the Company:</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {description}
              </p>
            </div>
            
            {/* Hiring Manager - With 51px spacing */}
            <div style={{ marginTop: '20px' }}>
              <h4 className="font-medium text-gray-900 mb-1">Hiring Manager</h4>
              {/* Hiring Manager details in horizontal line */}
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium text-gray-900">{maskContactInfo('available', 'Ms. Rakesh Sharma', 'Ms. XXXXXXXXX')}</span>
                <span className="flex items-center gap-1 text-blue-600">
                  📞 {maskContactInfo('available', '+91 96543-21087', '+91 XXXXXXXXXX')}
                </span>
                <span className="flex items-center gap-1 text-blue-600">
                  📧 {maskContactInfo('available', 'rakesh.sharma@company.com', 'XXXXXXXXX@bit.edu')}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Section: Action Buttons */}
        <div className="flex flex-col gap-3 ml-auto self-center">
          {/* Action buttons */}
          <Button 
            onClick={() => onConnect(id)}
            className="bg-gradient-to-r from-[#0478EC] to-[#248FFB] text-white rounded-lg shadow-sm px-6 py-2.5 font-medium hover:opacity-90 flex items-center justify-center whitespace-nowrap"
            size="lg"
          >
            <Send className="size-4 mr-2 text-white" />
            <span>Send Invitation</span>
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => onViewDetails(id)}
            className="border-[#1383F3] text-[#1383F3] hover:bg-[#1383F3] hover:text-white rounded-lg px-6 py-2.5 font-medium flex items-center justify-center whitespace-nowrap"
          >
            <Eye className="size-4 mr-2" />
            <span>View Company</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ActiveConnection Component
function ActiveConnection({
  id,
  name,
  email,
  avatar,
  company,
  partnershipType,
  connectionDate,
  hasAcceptedInvitations,
  acceptedInvitationsCount,
  onDisconnect,
  onSendMessage,
  onScheduleInterview
}: Connection & {
  onDisconnect: (id: string) => void;
  onSendMessage: (id: string) => void;
  onScheduleInterview: (id: string) => void;
}) {
  const getPartnershipBadge = () => {
    switch (partnershipType) {
      case 'recruiter':
        return 'bg-indigo-100 text-indigo-800';
      case 'company':
        return 'bg-emerald-100 text-emerald-800';
      case 'partner':
        return 'bg-violet-100 text-violet-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 border border-indigo-100 hover:border-indigo-200 bg-gradient-to-br from-white to-indigo-50/20 border-l-4 border-l-indigo-500">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex items-start gap-4 flex-1">
          <Avatar className="size-16 flex-shrink-0">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-semibold text-lg">{name}</h3>
              <Badge className={getPartnershipBadge()}>
                {partnershipType}
              </Badge>
            </div>
            
            <h4 className="font-medium text-muted-foreground mb-3">{company}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <span>Connected {connectionDate}</span>
              </div>
            </div>

            {hasAcceptedInvitations && (
              <div className="flex items-center gap-2 text-sm">
                <Check className="size-4 text-green-500" />
                <span className="text-green-600">
                  {acceptedInvitationsCount} invitation{acceptedInvitationsCount !== 1 ? 's' : ''} accepted
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-3 lg:w-auto w-full lg:min-w-[200px]">
          <Button
            onClick={() => onScheduleInterview(id)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            size="lg"
          >
            <Calendar className="size-4 mr-2" />
            Schedule Interview
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSendMessage(id)}
              className="flex-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            >
              <MessageCircle className="size-3 mr-1" />
              Message
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDisconnect(id)}
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <X className="size-3 mr-1" />
              Disconnect
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// PendingRequest Component
function PendingRequest({
  id,
  type,
  name,
  email,
  company,
  requestMessage,
  requestDate,
  jobTitle,
  interviewDate,
  status,
  sourceType,
  onWithdraw,
  onViewCompany
}: PendingItem & {
  onWithdraw: (id: string) => void;
  onViewCompany: (id: string) => void;
}) {
  const getTypeIcon = () => {
    switch (type) {
      case 'connection':
        return <Link className="size-5 text-indigo-500" />;
      case 'invitation':
        return <Mail className="size-5 text-emerald-500" />;
      case 'interview':
        return <Calendar className="size-5 text-violet-500" />;
      default:
        return <Clock className="size-5 text-gray-500" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'connection':
        return 'Connection Request';
      case 'invitation':
        return 'Invitation Request';
      case 'interview':
        return 'Interview Scheduled';
      default:
        return 'Request';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'scheduled':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-[#FF8C11]/10 text-[#FF8C11] border border-[#FF8C11] hover:bg-[#FF8C11]/20';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border border-gray-300';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 border border-slate-200 hover:border-slate-300 bg-white border-l-4 border-l-blue-500">
      <div className="flex items-center gap-6">
        {/* Left Section: Avatar + Request Info */}
        <div className="flex items-start gap-4 flex-1">
          <Avatar className="size-16 flex-shrink-0 rounded-full">
            <AvatarFallback className="bg-purple-200 text-purple-700 font-semibold rounded-full">{company.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div>
            {type === 'invitation' ? (
              // Job Invitation Layout
              <>
                {/* Job Title with status badges */}
                <div className="mb-2">
                  <div className="flex items-center gap-5 mb-1">
                    <h3 className="font-bold text-xl text-slate-900">{jobTitle || 'Job Invitation'}</h3>
                    <div className="flex items-center gap-3">
                      {status === 'pending' ? (
                        <Badge className="bg-orange-100 text-orange-600 border border-orange-200 hover:bg-orange-100">
                          Pending
                        </Badge>
                      ) : status === 'expired' ? (
                        <Badge className="bg-gray-100 text-gray-600 border border-gray-300">
                          Expired
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-600 border border-green-200">
                          {status}
                        </Badge>
                      )}
                      <Badge className="bg-blue-100 text-blue-600 border border-blue-200 hover:bg-blue-100">
                        Applied {requestDate}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm">{company}</p>
                </div>
                
                {/* About job - Horizontal layout */}
                <div className="flex items-start" style={{ marginTop: '20px' }}>
                  <h4 className="font-medium text-black-400 min-w-max mr-4" style={{marginBottom: 0}}>About job:</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {requestMessage ? requestMessage.split('. ')[1] || requestMessage : 'Job invitation from ' + company + '. Review the details and respond accordingly.'}
                  </p>
                </div>

                {/* Message Section - Show the message sent with the request */}
                {requestMessage && status === 'pending' && sourceType === 'sent_invitation' && (
                  <div className="flex items-start" style={{ marginTop: '20px' }}>
                    <h4 className="font-medium text-gray-900 min-w-max mr-4">Message:</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {requestMessage.includes('Invitation sent for') ? requestMessage.split('. ').slice(1).join('. ') : requestMessage}
                    </p>
                  </div>
                )}
              </>
            ) : (
              // Company Connection Layout
              <>
                {/* Company Name with status badges */}
                <div className="mb-2">
                  <div className="flex items-center gap-4 mb-1">
                    <h3 className="font-bold text-xl text-slate-900">{company}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Founded Year: <span className="font-medium">2020</span></span>
                      <span className="mx-2">Employees: <span className="font-medium">1-50</span></span>
                      <div className="flex items-center gap-1">
                        <MapPin className="size-4 text-gray-400" />
                        <span>Remote</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-gray-500 text-sm">Technology</p>
                    <div className="text-sm text-gray-600">
                      <span>Status: </span>
                      {status === 'pending' ? (
                        <span className="text-orange-600 font-medium">Pending Response</span>
                      ) : status === 'expired' ? (
                        <span className="text-gray-600 font-medium">Expired</span>
                      ) : (
                        <span className="text-green-600 font-medium">{status}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* About the Company - Horizontal layout */}
                <div className="flex items-start" style={{ marginTop: '20px' }}>
                  <h4 className="font-medium text-black-400 min-w-max mr-4" style={{marginBottom: 0}}>About the Company:</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {company + ' is interested in exploring partnership opportunities with your college for student placements.'}
                  </p>
                </div>

                {/* Message Section - Show the message sent with the request */}
                {requestMessage && status === 'pending' && sourceType === 'sent_invitation' && (
                  <div className="flex items-start" style={{ marginTop: '20px' }}>
                    <h4 className="font-medium text-gray-900 min-w-max mr-4">Message:</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {requestMessage}
                    </p>
                  </div>
                )}
              </>
            )}
            
            {/* Hiring Manager - With 51px spacing */}
            <div style={{ marginTop: '20px' }}>
              <h4 className="font-medium text-gray-900 mb-1">Contact Person</h4>
              {/* Contact details in horizontal line */}
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium text-gray-900">{maskContactInfo(status, name, 'Ms. XXXXXXXXX')}</span>
                <span className="flex items-center gap-1 text-blue-600">
                  📞 {maskContactInfo(status, '+91 98765-43210', '+91 XXXXXXXXXX')}
                </span>
                <span className="flex items-center gap-1 text-blue-600">
                  📧 {maskContactInfo(status, email, 'XXXXXXXXX@bit.edu')}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Section: Action Buttons */}
        <div className="flex flex-col gap-3 ml-auto self-center">
          {/* Main action button */}
          {status === 'pending' && sourceType === 'sent_invitation' && (
            <Button
              onClick={() => onWithdraw(id)}
              className="bg-gradient-to-r from-[#D8A714] to-[#E9BC19] text-white rounded-lg shadow hover:opacity-90 px-6 py-2.5 font-medium flex items-center justify-center whitespace-nowrap"
              size="lg"
            >
              <Unplug className="size-4 mr-2 text-white" />
              <span>Withdraw</span>
            </Button>
          )}

          {status === 'expired' && (
            <Button
              disabled
              variant="outline"
              className="px-6 py-2.5 cursor-not-allowed opacity-60 border-gray-200 text-gray-600 font-medium flex items-center justify-center"
              size="lg"
            >
              <X className="size-4 mr-2" />
              <span>Request Expired</span>
            </Button>
          )}

          {status === 'pending' && !sourceType && (
            <Button
              disabled
              variant="outline"
              className="px-6 py-2.5 cursor-not-allowed opacity-60 font-medium flex items-center justify-center"
              size="lg"
            >
              <Clock className="size-4 mr-2" />
              <span>Awaiting Response</span>
            </Button>
          )}
          
          {/* Secondary actions */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => onViewCompany(id)}
            className="bg-white border-[#1383F3] text-[#1383F3] hover:bg-[#1383F3] hover:text-white rounded-lg px-6 py-2.5 font-medium flex items-center justify-center whitespace-nowrap"
          >
            <Eye className="size-4 mr-2 text-[#1383F3]" />
            <span>View Company</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

// StudentsViewDialog Component
function StudentsViewDialog({
  open,
  onOpenChange,
  title,
  companyName,
  students,
  jobDetails,
  onNotifyStudents
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  companyName: string;
  students: Student[];
  jobDetails?: {
    title: string;
    location: string;
    salary: string;
    department: string;
  };
  onNotifyStudents?: () => void;
}) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
    setSelectAll(!selectAll);
  };

  React.useEffect(() => {
    setSelectAll(selectedStudents.length === students.length && students.length > 0);
  }, [selectedStudents, students]);

  const handleNotifyClick = () => {
    if (selectedStudents.length === 0) {
      toast({ type: 'warning', description: 'Please select at least one student to notify.' });
      return;
    }
    if (onNotifyStudents) {
      onNotifyStudents();
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">
            {title}
          </DialogTitle>
          <div className="text-sm text-slate-600">
            {companyName} • {students.length} students shortlisted
          </div>
        </DialogHeader>

        {jobDetails && (
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-slate-900 mb-2">Job Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Briefcase className="size-4 text-slate-500" />
                <span>{jobDetails.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-slate-500" />
                <span>{jobDetails.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="size-4 text-slate-500" />
                <span>{jobDetails.salary}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="size-4 text-slate-500" />
                <span>{jobDetails.department}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-medium text-slate-900">Shortlisted Students</h3>
          
          {students.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users className="size-12 mx-auto mb-3 text-slate-300" />
              <p>No students shortlisted yet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {students.map((student) => (
                <Card key={student.id} className={`p-4 hover:shadow-md transition-shadow border-2 ${
                  selectedStudents.includes(student.id) ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => handleStudentSelect(student.id)}
                        className="mt-1"
                      />
                      <Avatar className="size-12 flex-shrink-0">
                        <AvatarImage src={student.avatar} alt={student.name} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-slate-900">{student.name}</h4>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                          Shortlisted
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="size-4 text-slate-500" />
                            <span className="text-slate-600 font-medium">{student.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="size-4 text-slate-500" />
                            <span className="text-slate-600 font-medium">{student.phone}</span>
                          </div>
                          {student.rollNumber && (
                            <div className="flex items-center gap-2">
                              <GraduationCap className="size-4 text-slate-500" />
                              <span className="text-slate-600">Roll: {student.rollNumber}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <BookOpen className="size-4 text-slate-500" />
                            <span className="text-slate-600">{student.department}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className="size-4 text-slate-500" />
                            <span className="text-slate-600">{student.year} • GPA: {student.gpa}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => window.open(`tel:${student.phone}`, '_self')}
                      >
                        <Phone className="size-3 mr-1" />
                        Call
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => window.open(`sms:${student.phone}`, '_self')}
                      >
                        <MessageCircle className="size-3 mr-1" />
                        SMS
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectAll}
                onCheckedChange={handleSelectAll}
                className="size-5"
              />
              <label className="font-medium text-slate-900">
                Select All ({students.length} students)
              </label>
            </div>
            {selectedStudents.length > 0 && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                {selectedStudents.length} selected
              </Badge>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            
            <Button 
              variant="outline"
              className="border-slate-300"
              onClick={() => {
                toast({ 
                  type: 'success', 
                  description: `Contact information for ${students.length} students has been exported` 
                });
              }}
            >
              <Download className="size-4 mr-2" />
              Export Contacts
            </Button>
            
            {onNotifyStudents && (
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleNotifyClick}
                disabled={selectedStudents.length === 0}
              >
                <MessageCircle className="size-4 mr-2" />
                Message Selected ({selectedStudents.length})
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Additional components would go here - for brevity, I'll include the key ones
// BatchSelectionDialog, CompanyDetailsDialog, TwoStepInvitationDialog, etc.

// Props interface for InvitationsConnections
interface InvitationsConnectionsProps {
  onInvitationResponse?: (invitationId: string, action: 'accepted' | 'declined', message?: string) => Promise<void>;
  onConnectionRequest?: (companyId: string, message?: string) => Promise<void>;
  onJobInvitationRequest?: (jobId: string, companyId: string, message?: string) => Promise<void>;
}

// MAIN INVITATIONS CONNECTIONS COMPONENT
export default function InvitationsConnections({
  onInvitationResponse,
  onConnectionRequest,
  onJobInvitationRequest
}: InvitationsConnectionsProps = {}) {
  // State for active tab
  const [activeTab, setActiveTab] = useState('invitations');

  // State for filter
  const [currentFilter, setCurrentFilter] = useState('all');

  // State for various dialogs
  const [messageDialog, setMessageDialog] = useState<{
    open: boolean;
    type: 'connect' | 'invitation' | 'disconnect' | 'sendMessage';
    targetId: string;
    targetName: string;
  }>({
    open: false,
    type: 'connect',
    targetId: '',
    targetName: ''
  });
  
  const [studentSelectionDialog, setStudentSelectionDialog] = useState<{
    open: boolean;
    invitationId: string;
    jobTitle: string;
    companyName: string;
    maxStudents: number;
  }>({
    open: false,
    invitationId: '',
    jobTitle: '',
    companyName: '',
    maxStudents: 0
  });

  const [whatsAppDialog, setWhatsAppDialog] = useState<{
    open: boolean;
    jobTitle: string;
    companyName: string;
  }>({
    open: false,
    jobTitle: '',
    companyName: ''
  });

  const [companyDetailsDialog, setCompanyDetailsDialog] = useState<{
    open: boolean;
    company: Company | null;
    context: 'send_invitations' | 'invitations' | 'status';
  }>({
    open: false,
    company: null,
    context: 'send_invitations'
  });

  const [interviewSchedulingDialog, setInterviewSchedulingDialog] = useState<{
    open: boolean;
    connectionId: string;
    connectionName: string;
    jobTitle?: string;
    companyName?: string;
    shortlistedStudents?: Student[];
  }>({
    open: false,
    connectionId: '',
    connectionName: '',
    jobTitle: '',
    companyName: '',
    shortlistedStudents: []
  });

  const [studentsViewDialog, setStudentsViewDialog] = useState<{
    open: boolean;
    title: string;
    companyName: string;
    students: Student[];
    jobDetails?: {
      title: string;
      location: string;
      salary: string;
      department: string;
    };
  }>({
    open: false,
    title: '',
    companyName: '',
    students: [],
    jobDetails: undefined
  });

  // Status 3 & 4: "Pending" and "Expired" - Requests/Invitations WE have sent (Status section)
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([
    // Pending Status - Requests WE sent and are waiting for response
    {
      id: 'pending-1',
      type: 'invitation',
      name: 'Ms. Kavya Nair',
      email: 'kavya.nair@xyzcorp.com',
      avatar: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&h=100&fit=crop&crop=center',
      company: 'XyzCorp.Inc',
      requestMessage: 'We are interested in exploring partnership opportunities with your company. Our students are well-trained in modern technologies and ready for challenging projects.',
      requestDate: 'Dec 1, 2024',
      jobTitle: 'Partnership Request',
      status: 'pending',
      sourceType: 'sent_invitation',
      message: 'We are interested in exploring partnership opportunities with your company. Our students are well-trained in modern technologies and ready for challenging projects.'
    },
    {
      id: 'pending-2', 
      type: 'invitation',
      name: 'Mr. Arjun Gupta',
      email: 'arjun.gupta@paytm.com',
      avatar: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=100&h=100&fit=crop&crop=center',
      company: 'Paytm',
      requestMessage: 'Invitation sent for Product Manager Intern role. Awaiting company approval and next steps.',
      requestDate: 'Nov 28, 2024',
      jobTitle: 'Product Manager Intern',
      status: 'pending',
      sourceType: 'sent_invitation'
    },
    {
      id: 'pending-3',
      type: 'invitation',
      name: 'Ms. Sneha Reddy',
      email: 'sneha.reddy@zomato.com',
      avatar: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop&crop=center',
      company: 'Zomato',
      requestMessage: 'Sent invitation for Data Scientist internship program. Response pending from their HR team.',
      requestDate: 'Nov 25, 2024',
      jobTitle: 'Data Scientist Intern',
      status: 'pending',
      sourceType: 'sent_invitation'
    },
    // Expired Status - Requests WE sent that have expired without response
    {
      id: 'expired-1',
      type: 'invitation',
      name: 'Mr. Vikram Singh',
      email: 'vikram.singh@swiggy.in',
      avatar: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=100&fit=crop&crop=center',
      company: 'Swiggy',
      requestMessage: 'Our invitation request for Mobile App Developer position has expired. No response received by the deadline of Nov 15, 2024.',
      requestDate: 'Oct 20, 2024',
      jobTitle: 'Mobile App Developer',
      status: 'expired',
      sourceType: 'sent_invitation'
    },
    {
      id: 'expired-2',
      type: 'invitation',
      name: 'Ms. Meera Joshi',
      email: 'meera.joshi@byjus.com',
      avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop&crop=center',
      company: 'BYJU\'S',
      requestMessage: 'Expired invitation request for EdTech Developer position. Response deadline of Nov 10, 2024 has passed.',
      requestDate: 'Oct 15, 2024',
      jobTitle: 'EdTech Developer',
      status: 'expired',
      sourceType: 'sent_invitation'
    }
  ]);

  // Available batches data for student selection
  const [availableBatches, setAvailableBatches] = useState<Batch[]>([
    {
      id: 'batch-1',
      name: 'Computer Science 2024-A',
      department: 'Computer Science',
      year: 'Final Year',
      semester: 'Fall 2024',
      studentCount: 45,
      averageGPA: 3.8,
      completionRate: 94,
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'Cloud Computing', 'Database Design'],
      coordinator: {
        name: 'Dr. Sarah Chen',
        email: 'sarah.chen@college.edu',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=center'
      },
      description: 'Final year computer science students specializing in full-stack web development and software engineering with cloud technologies.',
      isActive: true,
      createdDate: '2024-09-01',
      isRecommended: true,
      students: [
        {
          id: 'student-batch-1',
          name: 'Alice Johnson',
          email: 'alice.j@college.edu',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=center',
          department: 'Computer Science',
          year: 'Final Year',
          gpa: 3.9,
          skills: ['React', 'TypeScript', 'Node.js', 'MongoDB'],
          phone: '+91 98765-43210',
          rollNumber: 'CS2024A001'
        }
      ]
    },
    {
      id: 'batch-2',
      name: 'Data Science & Analytics 2024',
      department: 'Data Science',
      year: 'Final Year',
      semester: 'Fall 2024',
      studentCount: 32,
      averageGPA: 3.9,
      completionRate: 97,
      skills: ['Python', 'Machine Learning', 'Deep Learning', 'Statistics', 'SQL', 'Tableau', 'TensorFlow'],
      coordinator: {
        name: 'Dr. James Liu',
        email: 'james.liu@college.edu',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=center'
      },
      description: 'Top-performing data science students with expertise in ML/AI, statistical analysis, and big data technologies.',
      isActive: true,
      createdDate: '2024-09-01',
      isRecommended: true
    },
    {
      id: 'batch-3',
      name: 'Information Technology 2024-B',
      department: 'Information Technology',
      year: 'Final Year',
      semester: 'Fall 2024',
      studentCount: 38,
      averageGPA: 3.7,
      completionRate: 91,
      skills: ['Java', 'Spring Boot', 'Angular', 'DevOps', 'AWS', 'Docker', 'Kubernetes'],
      coordinator: {
        name: 'Prof. Rajesh Kumar',
        email: 'rajesh.kumar@college.edu',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=center'
      },
      description: 'Information Technology students with strong backend development and cloud infrastructure skills.',
      isActive: true,
      createdDate: '2024-09-01',
      isRecommended: false
    },
    {
      id: 'batch-4',
      name: 'Business Administration 2025',
      department: 'Business Administration',
      year: 'Third Year',
      semester: 'Fall 2024',
      studentCount: 52,
      averageGPA: 3.6,
      completionRate: 93,
      skills: ['Digital Marketing', 'Finance', 'Business Analytics', 'Communication', 'Leadership', 'Project Management'],
      coordinator: {
        name: 'Dr. Emily Rodriguez',
        email: 'emily.rodriguez@college.edu',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=center'
      },
      description: 'Third year business students with expertise in digital marketing, financial analysis, and business strategy.',
      isActive: true,
      createdDate: '2024-09-01',
      isRecommended: true
    },
    {
      id: 'batch-5',
      name: 'Electronics & Communication 2024',
      department: 'Electronics & Communication',
      year: 'Final Year',
      semester: 'Fall 2024',
      studentCount: 41,
      averageGPA: 3.5,
      completionRate: 89,
      skills: ['Embedded Systems', 'VLSI Design', 'IoT', 'Signal Processing', 'C/C++', 'MATLAB'],
      coordinator: {
        name: 'Dr. Anita Sharma',
        email: 'anita.sharma@college.edu',
        avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop&crop=center'
      },
      description: 'Electronics and Communication students specializing in embedded systems and IoT development.',
      isActive: true,
      createdDate: '2024-09-01',
      isRecommended: false
    },
    {
      id: 'batch-6',
      name: 'Mechanical Engineering 2024-Advanced',
      department: 'Mechanical Engineering',
      year: 'Final Year',
      semester: 'Fall 2024',
      studentCount: 35,
      averageGPA: 3.6,
      completionRate: 90,
      skills: ['AutoCAD', 'SolidWorks', 'ANSYS', 'Manufacturing', 'Robotics', 'Project Management'],
      coordinator: {
        name: 'Prof. Michael Davis',
        email: 'michael.davis@college.edu',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=center'
      },
      description: 'Advanced mechanical engineering students with expertise in CAD/CAM, robotics, and manufacturing processes.',
      isActive: true,
      createdDate: '2024-09-01',
      isRecommended: false
    }
  ]);

  // Status 2: "Send Invitation" - Available Jobs where WE can send requests (Discover Jobs section)
  const [availableJobs, setAvailableJobs] = useState<JobOpportunity[]>([
    {
      id: 'job-1',
      title: 'Full Stack Developer',
      company: {
        name: 'StartupXYZ',
        logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&h=100&fit=crop&crop=center',
        industry: 'Fintech'
      },
      description: 'Build responsive web applications using React, Node.js, and TypeScript. Perfect for new graduates looking to make an impact in fintech industry.',
      location: 'Pune, India',
      salaryRange: {
        min: 600000,
        max: 900000,
        currency: 'INR',
        period: 'year'
      },
      deadline: 'Jan 20, 2025',
      experienceLevel: 'Entry Level (0-2 years)',
      applications: 23,
      type: 'full-time',
      department: 'Technology',
      status: 'available',
      selectedStudents: 0,
      shortlistedStudents: 0
    },
  {
    id: 'job-2',
    title: 'Digital Marketing Intern',
    company: {
      name: 'GrowthLab India',
      logo: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=100&h=100&fit=crop&crop=center',
      industry: 'Digital Marketing'
    },
    description: 'Support digital marketing campaigns, social media management, and learn growth hacking strategies in a fast-paced startup environment.',
    location: 'Bangalore, India',
    salaryRange: {
      min: 20000,
      max: 30000,
      currency: 'INR',
      period: 'month'
    },
    deadline: 'Feb 1, 2025',
    experienceLevel: 'Internship Level',
    applications: 12,
    type: 'internship',
    department: 'Marketing',
    status: 'available',
    selectedStudents: 0,
    shortlistedStudents: 0
  },
  {
    id: 'job-3',
    title: 'Data Analyst',
    company: {
      name: 'Analytics Pro Solutions',
      logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop&crop=center',
      industry: 'Data Analytics'
    },
    description: 'Analyze complex datasets, create visualizations, and provide actionable insights for business decisions using Python, SQL, and Tableau.',
    location: 'Chennai, India',
    salaryRange: {
      min: 400000,
      max: 600000,
      currency: 'INR',
      period: 'year'
    },
    deadline: 'Jan 31, 2025',
    experienceLevel: 'Entry Level (0-1 years)',
    applications: 18,
    type: 'full-time',
    department: 'Data Science',
    status: 'available',
    selectedStudents: 0,
    shortlistedStudents: 0
  },
  {
    id: 'job-4',
    title: 'Mobile App Developer',
    company: {
      name: 'MobileTech Solutions',
      logo: 'https://images.unsplash.com/photo-1556155092-490a1ba16284?w=100&h=100&fit=crop&crop=center',
      industry: 'Mobile Technology'
    },
    description: 'Develop cross-platform mobile applications using React Native and Flutter. Work on consumer-facing apps with millions of users.',
    location: 'Gurgaon, India',
    salaryRange: {
      min: 550000,
      max: 800000,
      currency: 'INR',
      period: 'year'
    },
    deadline: 'Feb 15, 2025',
    experienceLevel: 'Entry to Mid Level (0-3 years)',
    applications: 31,
    type: 'full-time',
    department: 'Mobile Development',
    status: 'available',
    selectedStudents: 0,
    shortlistedStudents: 0
  },
  // Job with students already sent (different status for demo)
  {
    id: 'job-5',
    title: 'DevOps Engineer Intern',
    company: {
      name: 'CloudOps India',
      logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop&crop=center',
      industry: 'Cloud Computing'
    },
    description: 'Learn DevOps practices, CI/CD pipelines, containerization with Docker and Kubernetes, and cloud deployment strategies.',
    location: 'Noida, India',
    salaryRange: {
      min: 25000,
      max: 40000,
      currency: 'INR',
      period: 'month'
    },
    deadline: 'Jan 25, 2025',
    experienceLevel: 'Internship Level',
    applications: 15,
    type: 'internship',
    department: 'DevOps',
    status: 'shortlisted',
    selectedStudents: 4,
    shortlistedStudents: 2,
    shortlistedStudentsList: [
      {
        id: 'student-3',
        name: 'Amit Singh',
        email: 'amit.s@college.edu',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=center',
        department: 'Computer Science',
        year: 'Third Year',
        gpa: 3.7,
        skills: ['Docker', 'Kubernetes', 'Linux', 'Python'],
        phone: '+91 76543-21098'
      },
      {
        id: 'student-4',
        name: 'Sneha Patel',
        email: 'sneha.p@college.edu',
        avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop&crop=center',
        department: 'Information Technology',
        year: 'Final Year',
        gpa: 3.6,
        skills: ['AWS', 'Jenkins', 'Git', 'Shell Scripting'],
        phone: '+91 65432-10987'
      }
    ]
  }
]);

  // Status 1: "Received Invitation" - Invitations/Requests we have RECEIVED from companies (both jobs and company partnerships)
  const [receivedInvitations, setReceivedInvitations] = useState<RecruitmentInvitation[]>([
    {
      id: 'received-1',
      type: 'job',
      company: {
        name: 'TechCorp Inc.',
        logo: 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=100&h=100&fit=crop&crop=center',
        industry: 'Technology',
        foundedYear: '2015',
        employees: '1-10',
        website: 'www.xyzcompany.com'
      },
      jobTitle: 'UX/UI Designer Intern',
      location: 'New Delhi sector-14',
      salaryRange: {
        min: 15000,
        max: 15000,
        currency: 'INR',
        period: 'month'
      },
      deadline: 'Oct 15, 2025',
      maxStudents: 3,
      daysLeft: 3,
      status: 'Available',
      description: 'Join our dynamic engineering team to work on cutting-edge web applications hands-on experience with modern tech stack.',
      sourceType: 'recruiter_invitation',
      recruiterName: 'Ms. Priya Sharma',
      recruiterEmail: 'priya.sharma@techcorp.com',
      recruiterPhone: '+91 98765-43210',
      message: 'We are excited to offer this UX/UI Designer internship opportunity to talented students from your college. This role will provide hands-on experience with modern design tools and methodologies.'
    },
    {
      id: 'received-2',
      type: 'company',
      company: {
        name: 'Tech Corp',
        logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop&crop=center',
        industry: 'Fintech Company',
        foundedYear: '2015',
        employees: '1-10',
        website: 'www.xyzcompany.com'
      },
      location: 'Bangalore, Karnataka',
      status: 'pending',
      description: 'lorem ipsum kirin demo job description software developer intern in fintech position dummy text even writing...',
      sourceType: 'recruiter_invitation',
      recruiterName: 'Ms. Ankita Desai',
      recruiterEmail: 'ankita.desai@techcorp.com',
      recruiterPhone: '+91 87654-32109'
    },
    {
      id: 'received-3',
      type: 'company',
      company: {
        name: 'XyzCorp.Inc',
        logo: 'https://images.unsplash.com/photo-1556155092-490a1ba16284?w=100&h=100&fit=crop&crop=center',
        industry: 'Fintech Company',
        foundedYear: '2015',
        employees: '1-10',
        website: 'www.xyzcompany.com'
      },
      location: 'Bangalore, Karnataka',
      status: 'pending',
      description: 'lorem ipsum kirin demo job description software developer intern in fintech position dummy text even writing...',
      sourceType: 'recruiter_invitation',
      recruiterName: 'Ms. Ravi Patel',
      recruiterEmail: 'ravi.patel@xyzcorp.com',
      recruiterPhone: '+91 76543-21098',
      message: 'We are interested in establishing a partnership with your college for recruiting talented students. Please review our company profile and let us know your thoughts.'
    },
    {
      id: 'received-4',
      type: 'company',
      company: {
        name: 'Microsoft Corporation',
        logo: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=100&fit=crop&crop=center',
        industry: 'Technology Company',
        foundedYear: '1975',
        employees: '100000+',
        website: 'www.microsoft.com'
      },
      location: 'Bangalore, India',
      status: 'connected',
      description: 'Connected partnership with Microsoft. Full contact information visible for active recruiting collaboration.',
      sourceType: 'recruiter_invitation',
      recruiterName: 'Mr. Rajesh Kumar',
      recruiterEmail: 'rajesh.kumar@microsoft.com',
      recruiterPhone: '+91 98765-43210',
      message: 'We have established a successful partnership and look forward to ongoing collaboration.'
    }
  ]);


  const [companies, setCompanies] = useState<Company[]>([
    {
      id: '1',
      name: 'TechCorp Inc.',
      logo: 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=100&h=100&fit=crop&crop=center',
      industry: 'Technology',
      location: 'San Francisco, CA',
      description: 'A leading technology company specializing in enterprise software solutions and cloud infrastructure. We help businesses transform digitally with cutting-edge technology.',
      employeeCount: '1000-5000',
      foundingYear: 2015,
      activeJobs: 8,
      website: 'https://techcorpinc.com',
      email: 'careers@techcorpinc.com',
      phone: '+1 (555) 123-4567',
      address: 'San Francisco, CA',
      jobs: [
        {
          id: 'job1',
          title: 'Software Engineering Intern',
          company: {
            name: 'TechCorp Inc.',
            logo: 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=100&h=100&fit=crop&crop=center',
            industry: 'Technology'
          },
          description: 'Join our dynamic engineering team to build cutting-edge software solutions. Work with React, Node.js, and cloud technologies.',
          location: 'San Francisco, CA',
          salaryRange: {
            min: 450000,
            max: 650000,
            currency: 'INR',
            period: 'year'
          },
          deadline: 'Dec 25, 2024',
          experienceLevel: 'Entry level',
          applications: 0,
          type: 'full-time',
          department: 'Engineering'
        }
      ]
    },
    {
      id: '2',
      name: 'StartupXYZ',
      logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&h=100&fit=crop&crop=center',
      industry: 'Fintech',
      location: 'Pune, India',
      description: 'An innovative fintech startup revolutionizing digital payments and financial services. Join us to build the future of finance.',
      employeeCount: '50-200',
      foundingYear: 2020,
      activeJobs: 5,
      website: 'https://startupxyz.com',
      email: 'careers@startupxyz.com',
      phone: '+91 98765-43210',
      address: 'Pune, Maharashtra, India',
      jobs: [
        {
          id: 'job2',
          title: 'Full Stack Developer',
          company: {
            name: 'StartupXYZ',
            logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&h=100&fit=crop&crop=center',
            industry: 'Fintech'
          },
          description: 'Build responsive web applications using React, Node.js, and TypeScript. Perfect for new graduates looking to make an impact.',
          location: 'Pune, India',
          salaryRange: {
            min: 600000,
            max: 900000,
            currency: 'INR',
            period: 'year'
          },
          deadline: 'Jan 20, 2025',
          experienceLevel: 'Entry Level',
          applications: 23,
          type: 'full-time',
          department: 'Engineering'
        }
      ]
    },
    {
      id: '3',
      name: 'DataFlow Systems',
      logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop&crop=center',
      industry: 'Data Analytics',
      location: 'Bangalore, India',
      description: 'Leading data analytics company providing AI-powered business intelligence solutions to Fortune 500 companies.',
      employeeCount: '500-1000',
      foundingYear: 2018,
      activeJobs: 12,
      website: 'https://dataflowsystems.com',
      email: 'hr@dataflowsystems.com',
      phone: '+91 80-2345-6789',
      address: 'Bangalore, Karnataka, India',
      jobs: [
        {
          id: 'job3',
          title: 'Data Science Intern',
          company: {
            name: 'DataFlow Systems',
            logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop&crop=center',
            industry: 'Data Analytics'
          },
          description: 'Work with large datasets and machine learning models to drive business insights. Experience with Python, SQL, and visualization tools required.',
          location: 'Bangalore, India',
          salaryRange: {
            min: 35000,
            max: 50000,
            currency: 'INR',
            period: 'month'
          },
          deadline: 'Jan 15, 2025',
          experienceLevel: 'Internship Level',
          applications: 0,
          type: 'internship',
          department: 'Data Science'
        }
      ]
    },
    {
      id: '4',
      name: 'Microsoft Corporation',
      logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&h=100&fit=crop&crop=center',
      industry: 'Technology',
      location: 'Hyderabad, India',
      description: 'Global technology leader enabling digital transformation for organizations worldwide. Join us to empower every person and organization on the planet to achieve more.',
      employeeCount: '10000+',
      foundingYear: 1975,
      activeJobs: 25,
      website: 'https://careers.microsoft.com',
      email: 'university@microsoft.com',
      phone: '+91 40-6777-1000',
      address: 'Hyderabad, Telangana, India',
      jobs: [
        {
          id: 'job4',
          title: 'Cloud Solutions Architect',
          company: {
            name: 'Microsoft Corporation',
            logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&h=100&fit=crop&crop=center',
            industry: 'Technology'
          },
          description: 'Design and implement cloud solutions using Azure services. This is an ongoing partnership program for multiple batches.',
          location: 'Hyderabad, India',
          salaryRange: {
            min: 800000,
            max: 1200000,
            currency: 'INR',
            period: 'year'
          },
          deadline: 'Ongoing',
          experienceLevel: 'Entry to Mid Level',
          applications: 0,
          type: 'full-time',
          department: 'Cloud Solutions'
        }
      ]
    },
    {
      id: '5',
      name: 'InnovateLabs',
      logo: 'https://images.unsplash.com/photo-1556155092-490a1ba16284?w=100&h=100&fit=crop&crop=center',
      industry: 'Design & UX',
      location: 'Mumbai, India',
      description: 'Creative design studio specializing in user experience design for digital products. We create meaningful and intuitive experiences.',
      employeeCount: '20-50',
      foundingYear: 2019,
      activeJobs: 3,
      website: 'https://innovatelabs.design',
      email: 'careers@innovatelabs.design',
      phone: '+91 22-1234-5678',
      address: 'Mumbai, Maharashtra, India',
      jobs: [
        {
          id: 'job5',
          title: 'UX/UI Designer Intern',
          company: {
            name: 'InnovateLabs',
            logo: 'https://images.unsplash.com/photo-1556155092-490a1ba16284?w=100&h=100&fit=crop&crop=center',
            industry: 'Design & UX'
          },
          description: 'Create beautiful and intuitive user experiences for web and mobile applications. Proficiency in Figma, Adobe Creative Suite required.',
          location: 'Mumbai, India',
          salaryRange: {
            min: 25000,
            max: 35000,
            currency: 'INR',
            period: 'month'
          },
          deadline: 'Dec 30, 2024',
          experienceLevel: 'Internship Level',
          applications: 0,
          type: 'internship',
          department: 'Design'
        }
      ]
    },
    {
      id: '6',
      name: 'GrowthLab India',
      logo: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=100&h=100&fit=crop&crop=center',
      industry: 'Digital Marketing',
      location: 'Bangalore, India',
      description: 'Digital marketing agency helping startups and enterprises scale their online presence through data-driven marketing strategies.',
      employeeCount: '100-200',
      foundingYear: 2017,
      activeJobs: 6,
      website: 'https://growthlabindia.com',
      email: 'careers@growthlabindia.com',
      phone: '+91 80-9876-5432',
      address: 'Bangalore, Karnataka, India'
    },
    {
      id: '7',
      name: 'CloudOps India',
      logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop&crop=center',
      industry: 'Cloud Computing',
      location: 'Noida, India',
      description: 'Cloud infrastructure and DevOps solutions provider specializing in containerization, CI/CD, and cloud-native architectures.',
      employeeCount: '200-500',
      foundingYear: 2016,
      activeJobs: 10,
      website: 'https://cloudopsindia.com',
      email: 'hiring@cloudopsindia.com',
      phone: '+91 120-456-7890',
      address: 'Noida, Uttar Pradesh, India'
    }
  ]);

  // Status 5: "Connected/Partner" - These connections would normally be shown in CollegeConnectionManager.tsx
  const activeConnections: Connection[] = [
    {
      id: 'conn-1',
      name: 'Rajesh Gupta',
      email: 'rajesh.gupta@microsoft.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=center',
      company: 'Microsoft Corporation',
      partnershipType: 'recruiter',
      connectionDate: 'Nov 1, 2024',
      hasAcceptedInvitations: true,
      acceptedInvitationsCount: 3
    },
    {
      id: 'conn-2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@techcorp.com',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=center',
      company: 'TechCorp Inc.',
      partnershipType: 'recruiter',
      connectionDate: 'Oct 15, 2024',
      hasAcceptedInvitations: true,
      acceptedInvitationsCount: 2
    },
    {
      id: 'conn-3',
      name: 'Priya Sharma',
      email: 'priya.sharma@dataflow.com',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=center',
      company: 'DataFlow Systems',
      partnershipType: 'company',
      connectionDate: 'Oct 28, 2024',
      hasAcceptedInvitations: true,
      acceptedInvitationsCount: 1
    },
    {
      id: 'conn-4',
      name: 'Amit Verma',
      email: 'amit.verma@startupxyz.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=center',
      company: 'StartupXYZ',
      partnershipType: 'partner',
      connectionDate: 'Nov 10, 2024',
      hasAcceptedInvitations: true,
      acceptedInvitationsCount: 1
    },
    {
      id: 'conn-5',
      name: 'Dr. Kavya Nair',
      email: 'kavya.nair@innovatelabs.design',
      avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop&crop=center',
      company: 'InnovateLabs',
      partnershipType: 'recruiter',
      connectionDate: 'Nov 5, 2024',
      hasAcceptedInvitations: true,
      acceptedInvitationsCount: 1
    }
  ];

  // Filter Functions
  const getFilterOptions = (section: string) => {
    switch (section) {
      case 'invitations':
        return [
          { value: 'all', label: 'All Invitations' },
          { value: 'pending', label: 'Pending' },
          { value: 'available', label: 'Available' },
          { value: 'newest', label: 'Newest First' },
          { value: 'oldest', label: 'Oldest First' }
        ];
      case 'jobs':
        return [
          { value: 'all', label: 'All Jobs' },
          { value: 'available', label: 'Available' },
          { value: 'full-time', label: 'Full Time' },
          { value: 'internship', label: 'Internship' },
          { value: 'newest', label: 'Newest First' },
          { value: 'oldest', label: 'Oldest First' }
        ];
      case 'companies':
        return [
          { value: 'all', label: 'All Companies' },
          { value: 'newest', label: 'Newest First' },
          { value: 'oldest', label: 'Oldest First' },
          { value: 'small', label: 'Small (1-50)' },
          { value: 'medium', label: 'Medium (51-500)' },
          { value: 'large', label: 'Large (500+)' }
        ];
      case 'pending':
        return [
          { value: 'all', label: 'All Status' },
          { value: 'pending', label: 'Pending' },
          { value: 'expired', label: 'Expired' },
          { value: 'newest', label: 'Newest First' },
          { value: 'oldest', label: 'Oldest First' }
        ];
      default:
        return [{ value: 'all', label: 'All' }];
    }
  };

  const applyFilter = (data: any[], section: string, filter: string) => {
    let filtered = [...data];
    
    switch (filter) {
      case 'pending':
        filtered = filtered.filter(item => item.status === 'pending');
        break;
      case 'available':
        filtered = filtered.filter(item => item.status === 'available' || item.status === 'Available');
        break;
      case 'expired':
        filtered = filtered.filter(item => item.status === 'expired');
        break;
      case 'full-time':
        filtered = filtered.filter(item => item.type === 'full-time');
        break;
      case 'internship':
        filtered = filtered.filter(item => item.type === 'internship');
        break;
      case 'small':
        filtered = filtered.filter(item => {
          const employeeCount = item.employeeCount || item.employees;
          return employeeCount && (employeeCount.includes('1-') || employeeCount.includes('50'));
        });
        break;
      case 'medium':
        filtered = filtered.filter(item => {
          const employeeCount = item.employeeCount || item.employees;
          return employeeCount && (employeeCount.includes('51-') || employeeCount.includes('200') || employeeCount.includes('500'));
        });
        break;
      case 'large':
        filtered = filtered.filter(item => {
          const employeeCount = item.employeeCount || item.employees;
          return employeeCount && (employeeCount.includes('1000') || employeeCount.includes('5000+') || employeeCount.includes('100000+'));
        });
        break;
      case 'newest':
        filtered = filtered.sort((a, b) => {
          const dateA = new Date(a.deadline || a.requestDate || a.connectionDate || 0);
          const dateB = new Date(b.deadline || b.requestDate || b.connectionDate || 0);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'oldest':
        filtered = filtered.sort((a, b) => {
          const dateA = new Date(a.deadline || a.requestDate || a.connectionDate || 0);
          const dateB = new Date(b.deadline || b.requestDate || b.connectionDate || 0);
          return dateA.getTime() - dateB.getTime();
        });
        break;
      default:
        // 'all' - no filtering
        break;
    }
    
    return filtered;
  };

  // Event Handlers
  const handleAcceptInvitation = (id: string) => {
    // Find the invitation being accepted
    const invitation = receivedInvitations.find(inv => inv.id === id);
    if (invitation) {
      // Remove from invitations list (it will now move to Connected/Partner status)
      setReceivedInvitations(prev => prev.filter(inv => inv.id !== id));
      
      // Add to active connections (Connected/Partner status)
      const newConnection: Connection = {
        id: `conn-${Date.now()}`,
        name: `HR Team`,
        email: `hr@${invitation.company.name.toLowerCase().replace(/\s+/g, '')}.com`,
        avatar: invitation.company.logo,
        company: invitation.company.name,
        partnershipType: 'recruiter',
        connectionDate: new Date().toLocaleDateString(),
        hasAcceptedInvitations: true,
        acceptedInvitationsCount: 1
      };
      
      // Note: In real implementation, this would be handled by CollegeConnectionManager.tsx
      // For now, we just remove from invitations to simulate the move to Connected/Partner status
      
      toast({ 
        type: 'success', 
        description: `Partnership established with ${invitation.company.name}! They are now in your Hiring Companies section.` 
      });
    }
  };

  const handleDeclineInvitation = (id: string) => {
    setReceivedInvitations(prev => prev.filter(inv => inv.id !== id));
    toast({ type: 'success', description: 'Invitation declined.' });
  };

  // handleSendStudents is no longer needed since invitations go directly to Connected/Partner status
  // const handleSendStudents = (id: string) => {
  //   // This function is deprecated - invitations now go directly to Connected/Partner status
  // };

  const handleStudentSelectionConfirm = (selectedStudents: Student[], selectedBatches: Batch[]) => {
    const { invitationId } = studentSelectionDialog;
    
    // Calculate total students from individual selection and batches
    const totalBatchStudents = selectedBatches.reduce((total, batch) => total + batch.studentCount, 0);
    const totalSelected = selectedStudents.length + totalBatchStudents;
    
    // Check if this is for a job opportunity (from jobs tab) or an invitation (from invitations tab)
    const isJobRequest = availableJobs.find(job => job.id === invitationId);
    const isInvitation = receivedInvitations.find(inv => inv.id === invitationId);
    
    if (isJobRequest) {
      // Handle job request with student selection
      setAvailableJobs(prev => 
        prev.map(job => 
          job.id === invitationId 
            ? { 
                ...job, 
                status: 'students_selected' as const,
                selectedStudents: totalSelected
              }
            : job
        )
      );
      
      let message = '';
      if (selectedBatches.length > 0 && selectedStudents.length > 0) {
        message = `Job request sent with ${selectedStudents.length} individual students and ${selectedBatches.length} batch(es) (${totalBatchStudents} students)!`;
      } else if (selectedBatches.length > 0) {
        message = `Job request sent with ${selectedBatches.length} batch(es) (${totalBatchStudents} students)!`;
      } else {
        message = `Job request sent with ${selectedStudents.length} students!`;
      }
      
      toast({ type: 'success', description: message });
      
      // Simulate job approval process
      setTimeout(() => {
        setAvailableJobs(prev => 
          prev.map(job => 
            job.id === invitationId 
              ? { ...job, status: 'invitation_sent' as const }
              : job
          )
        );
        toast({ type: 'info', description: 'Your job request is being reviewed by the company...' });
      }, 2000);

      setTimeout(() => {
        setAvailableJobs(prev => 
          prev.map(job => 
            job.id === invitationId 
              ? { ...job, status: 'approved' as const }
              : job
          )
        );
        toast({ type: 'info', description: 'Great news! Your job request has been approved!' });
      }, 5000);

      setTimeout(() => {
        setAvailableJobs(prev => 
          prev.map(job => 
            job.id === invitationId 
              ? { 
                  ...job, 
                  status: 'shortlisted' as const,
                  shortlistedStudents: Math.min(2, totalSelected)
                }
              : job
          )
        );
        toast({ type: 'success', description: 'Students have been shortlisted! You can now schedule interviews.' });
      }, 8000);
      
    } else if (isInvitation) {
      // Handle invitation acceptance with student selection (existing logic)
      setReceivedInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId 
            ? { 
                ...inv, 
                selectedStudents,
                status: 'students_sent' as const
              }
            : inv
        )
      );
      
      let message = '';
      if (selectedBatches.length > 0 && selectedStudents.length > 0) {
        message = `${selectedStudents.length} individual students and ${selectedBatches.length} batch(es) (${totalBatchStudents} students) sent to recruiter!`;
      } else if (selectedBatches.length > 0) {
        message = `${selectedBatches.length} batch(es) (${totalBatchStudents} students) sent to recruiter!`;
      } else {
        message = `${selectedStudents.length} students sent to recruiter for review!`;
      }
      
      toast({ type: 'success', description: message });
      
      // Simulate recruiter review process
      setTimeout(() => {
        setReceivedInvitations(prev => 
          prev.map(inv => 
            inv.id === invitationId 
              ? { ...inv, status: 'under_review' as const }
              : inv
          )
        );
        toast({ type: 'info', description: 'Recruiter is now reviewing the students...' });
      }, 2000);

      setTimeout(() => {
        setReceivedInvitations(prev => 
          prev.map(inv => 
            inv.id === invitationId 
              ? { 
                  ...inv, 
                  status: 'shortlisted' as const,
                  shortlistedStudents: selectedStudents.slice(0, Math.min(2, selectedStudents.length))
                }
              : inv
          )
        );
        toast({ type: 'success', description: 'Great news! The recruiter has shortlisted students. You can now schedule interviews!' });
      }, 8000);
    }
    
    setStudentSelectionDialog(prev => ({ ...prev, open: false }));
  };

  const handleNotifyShortlisted = (id: string) => {
    const invitation = receivedInvitations.find(inv => inv.id === id);
    if (invitation && invitation.shortlistedStudents && invitation.shortlistedStudents.length > 0) {
      // Open interview scheduling dialog for all shortlisted students
      setInterviewSchedulingDialog({
        open: true,
        connectionId: id,
        connectionName: invitation.company.name,
        jobTitle: invitation.jobTitle,
        companyName: invitation.company.name,
        shortlistedStudents: invitation.shortlistedStudents
      });
    }
  };

  const handleViewCompany = (itemId: string) => {
    // First check if it's an invitation
    const invitation = receivedInvitations.find(inv => inv.id === itemId);
    if (invitation) {
      // Find the full company details by matching company name
      const company = companies.find(c => c.name === invitation.company.name);
      if (company) {
        setCompanyDetailsDialog({
          open: true,
          company: company,
          context: 'invitations'
        });
      } else {
        // Create a minimal company object from invitation data
        const companyFromInvitation: Company = {
          id: invitation.id,
          name: invitation.company.name,
          logo: invitation.company.logo,
          industry: invitation.company.industry,
          location: invitation.location,
          description: `A leading company in ${invitation.company.industry}. Contact us for more information about career opportunities.`,
          employeeCount: 'Contact for details',
          foundingYear: 2020,
          activeJobs: 1,
          website: `https://${invitation.company.name.toLowerCase().replace(/\s+/g, '')}.com`
        };
        setCompanyDetailsDialog({
          open: true,
          company: companyFromInvitation,
          context: 'invitations'
        });
      }
      return;
    }

    // If not found in invitations, check if it's a job
    const job = availableJobs.find(j => j.id === itemId);
    if (job) {
      // Find the full company details by matching company name
      const company = companies.find(c => c.name === job.company.name);
      if (company) {
        setCompanyDetailsDialog({
          open: true,
          company: company,
          context: 'send_invitations'
        });
      } else {
        // Create a minimal company object from job data
        const companyFromJob: Company = {
          id: `company-${Date.now()}`,
          name: job.company.name,
          logo: job.company.logo || '',
          industry: job.company.industry || 'Technology',
          location: job.location || 'Not specified',
          description: `${job.company.name} is actively hiring for ${job.title} position. ${job.description}`,
          employeeCount: '50-200',
          foundingYear: 2015,
          activeJobs: 1,
          website: `https://${job.company.name.toLowerCase().replace(/\s+/g, '')}.com`,
          email: `careers@${job.company.name.toLowerCase().replace(/\s+/g, '')}.com`,
          phone: '+91 98765-43210',
          address: job.location || 'India'
        };
        setCompanyDetailsDialog({
          open: true,
          company: companyFromJob,
          context: 'send_invitations'
        });
      }
    }
  };

  const handleSendConnectionFromInvitation = (invitationId: string) => {
    const invitation = receivedInvitations.find(inv => inv.id === invitationId);
    if (invitation) {
      setMessageDialog({
        open: true,
        type: 'connect',
        targetId: invitationId,
        targetName: invitation.company.name
      });
    }
  };

  const handleJobRequestInvitation = (id: string) => {
    const job = availableJobs.find(j => j.id === id);
    if (job) {
      setMessageDialog({
        open: true,
        type: 'invitation',
        targetId: id,
        targetName: job.company.name
      });
    }
  };

  const handleJobSendToRecruiter = (id: string) => {
    setAvailableJobs(prev => 
      prev.map(job => 
        job.id === id 
          ? { ...job, status: 'invitation_sent' as const }
          : job
      )
    );
    toast({ type: 'success', description: 'Application sent to recruiter for review!' });

    setTimeout(() => {
      setAvailableJobs(prev => 
        prev.map(job => 
          job.id === id 
            ? { ...job, status: 'approved' as const }
            : job
        )
      );
      toast({ type: 'info', description: 'Great news! Your application has been approved by the recruiter.' });
    }, 3000);

    setTimeout(() => {
      setAvailableJobs(prev => 
        prev.map(job => 
          job.id === id 
            ? { ...job, status: 'shortlisted' as const, shortlistedStudents: Math.floor((job.selectedStudents || 0) * 0.6) }
            : job
        )
      );
      toast({ type: 'success', description: 'Students have been shortlisted! You can now notify them.' });
    }, 8000);
  };

  const handleJobNotifyStudents = (id: string) => {
    const job = availableJobs.find(j => j.id === id);
    if (job) {
      setWhatsAppDialog({
        open: true,
        jobTitle: job.title,
        companyName: job.company.name
      });
      
      setAvailableJobs(prev => 
        prev.map(j => 
          j.id === id 
            ? { ...j, status: 'notified' as const }
            : j
        )
      );
    }
  };

  const handleJobScheduleInterview = (id: string) => {
    const job = availableJobs.find(j => j.id === id);
    if (job) {
      // Create mock shortlisted students for the interview scheduling
      const mockShortlistedStudents: Student[] = [
        {
          id: '1',
          name: 'Alice Johnson',
          email: 'alice.j@college.edu',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=center',
          department: 'Computer Science',
          year: 'Final Year',
          gpa: 3.8,
          skills: ['React', 'TypeScript', 'Node.js'],
          phone: '+1 (555) 123-4567'
        },
        {
          id: '2',
          name: 'David Wilson',
          email: 'david.w@college.edu',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=center',
          department: 'Computer Science',
          year: 'Final Year',
          gpa: 3.9,
          skills: ['React', 'TypeScript', 'Full Stack'],
          phone: '+1 (555) 345-6789'
        }
      ];

      setInterviewSchedulingDialog({
        open: true,
        connectionId: id,
        connectionName: job.company.name,
        jobTitle: job.title,
        companyName: job.company.name,
        shortlistedStudents: mockShortlistedStudents
      });

      setAvailableJobs(prev => 
        prev.map(j => 
          j.id === id 
            ? { ...j, status: 'interview_scheduled' as const }
            : j
        )
      );
    }
  };

  const handleViewJobStudents = (id: string) => {
    const job = availableJobs.find(j => j.id === id);
    if (job && job.shortlistedStudentsList) {
      setStudentsViewDialog({
        open: true,
        title: `Shortlisted Students - ${job.title}`,
        companyName: job.company.name,
        students: job.shortlistedStudentsList,
        jobDetails: {
          title: job.title,
          location: job.location,
          salary: `${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()}${job.salaryRange.period ? ` per ${job.salaryRange.period}` : ''}`,
          department: job.department || 'Technology'
        }
      });
    } else {
      toast({ 
        type: 'info', 
        description: 'No students have been shortlisted for this position yet.' 
      });
    }
  };

  const handleRecruitmentScheduleInterview = (id: string) => {
    const invitation = receivedInvitations.find(inv => inv.id === id);
    if (invitation && invitation.shortlistedStudents) {
      setInterviewSchedulingDialog({
        open: true,
        connectionId: id,
        connectionName: invitation.company.name,
        jobTitle: invitation.jobTitle,
        companyName: invitation.company.name,
        shortlistedStudents: invitation.shortlistedStudents
      });
    }
  };

  const handleViewRecruitmentStudents = (id: string) => {
    const invitation = receivedInvitations.find(inv => inv.id === id);
    if (invitation && invitation.shortlistedStudents && invitation.shortlistedStudents.length > 0) {
      setStudentsViewDialog({
        open: true,
        title: `Shortlisted Students - ${invitation.jobTitle}`,
        companyName: invitation.company.name,
        students: invitation.shortlistedStudents,
        jobDetails: {
          title: invitation.jobTitle,
          location: invitation.location,
          salary: `${invitation.salaryRange.min.toLocaleString()} - ${invitation.salaryRange.max.toLocaleString()}${invitation.salaryRange.period ? ` per ${invitation.salaryRange.period}` : ''}`,
          department: invitation.company.industry
        }
      });
    } else {
      toast({ 
        type: 'info', 
        description: 'No students have been shortlisted for this position yet.' 
      });
    }
  };

  const handleCompanyConnect = (id: string) => {
    const company = companies.find(c => c.id === id);
    if (company) {
      setMessageDialog({
        open: true,
        type: 'connect',
        targetId: id,
        targetName: company.name
      });
    }
  };

  const handleViewCompanyDetails = (id: string) => {
    const company = companies.find(c => c.id === id);
    if (company) {
      setCompanyDetailsDialog({
        open: true,
        company: company,
        context: 'send_invitations'
      });
    }
  };

  const handleViewCompanyFromStatus = (requestId: string) => {
    const request = pendingItems.find(item => item.id === requestId);
    if (request) {
      // Try to find the company by name in the companies array
      const company = companies.find(c => c.name === request.company);
      if (company) {
        setCompanyDetailsDialog({
          open: true,
          company: company,
          context: 'status'
        });
      } else {
        // Create a minimal company object from request data
        const companyFromRequest: Company = {
          id: requestId,
          name: request.company,
          logo: undefined,
          industry: 'Technology', // Default value
          location: 'Not specified',
          description: `Information about ${request.company} will be available soon.`,
          employeeCount: 'Contact for details',
          foundingYear: 2020,
          activeJobs: 1,
          website: `https://${request.company.toLowerCase().replace(/\s+/g, '')}.com`
        };
        setCompanyDetailsDialog({
          open: true,
          company: companyFromRequest,
          context: 'status'
        });
      }
    }
  };

  const handleDisconnect = (id: string) => {
    const connection = activeConnections.find(c => c.id === id);
    if (connection) {
      setMessageDialog({
        open: true,
        type: 'disconnect',
        targetId: id,
        targetName: connection.name
      });
    }
  };

  const handleSendMessage = (id: string) => {
    const connection = activeConnections.find(c => c.id === id);
    if (connection) {
      setMessageDialog({
        open: true,
        type: 'sendMessage',
        targetId: id,
        targetName: connection.name
      });
    }
  };

  const handleScheduleInterview = (id: string) => {
    const connection = activeConnections.find(c => c.id === id);
    if (connection) {
      setInterviewSchedulingDialog({
        open: true,
        connectionId: id,
        connectionName: connection.name
      });
    }
  };

  const handleInterviewSchedulingConfirm = (interviewDetails: InterviewDetails) => {
    const { connectionId, connectionName } = interviewSchedulingDialog;
    
    setInterviewSchedulingDialog({
      open: false,
      connectionId: '',
      connectionName: ''
    });
    
    toast({ 
      type: 'success', 
      description: `Interview scheduled with ${connectionName} for ${interviewDetails.date} at ${interviewDetails.time}` 
    });
    
    // You can add logic here to save the interview details to your backend
    console.log('Interview Details:', {
      connectionId,
      connectionName,
      ...interviewDetails
    });
  };

  const handleWithdrawRequest = (id: string) => {
    setPendingItems(prev => prev.filter(item => item.id !== id));
    toast({ type: 'success', description: 'Request withdrawn successfully.' });
  };

  const handleMessageConfirm = (message: string) => {
    const { type, targetId, targetName } = messageDialog;
    
    switch (type) {
      case 'connect':
        // Remove the company from the companies list (it's no longer available for connection)
        setCompanies(prev => prev.filter(company => company.id !== targetId));
        
        const newPendingConnection: PendingItem = {
          id: `pending-${Date.now()}`,
          type: 'connection',
          name: targetName,
          email: `contact@${targetName.toLowerCase().replace(/\s+/g, '')}.com`,
          company: targetName,
          requestMessage: message,
          requestDate: new Date().toLocaleDateString(),
          status: 'pending',
          sourceType: 'sent_invitation'
        };
        setPendingItems(prev => [newPendingConnection, ...prev]);
        toast({ type: 'success', description: `Connection request sent to ${targetName}! Check Status section for updates.` });
        break;
      case 'invitation':
        // Find the job details from availableJobs
        const jobDetails = availableJobs.find(job => job.id === targetId);
        if (jobDetails) {
          // Remove the job from availableJobs (it's no longer available since we sent an invitation)
          setAvailableJobs(prev => prev.filter(job => job.id !== targetId));
          
          // Add to pending items (Status section - Pending status)
          const newPendingInvitation: PendingItem = {
            id: `pending-${Date.now()}`,
            type: 'invitation',
            name: jobDetails.company.name,
            email: `hr@${jobDetails.company.name.toLowerCase().replace(/\s+/g, '')}.com`,
            company: jobDetails.company.name,
            requestMessage: message,
            requestDate: new Date().toLocaleDateString(),
            jobTitle: jobDetails.title,
            status: 'pending',
            sourceType: 'sent_invitation'
          };
          setPendingItems(prev => [newPendingInvitation, ...prev]);
          toast({ 
            type: 'success', 
            description: `Invitation sent to ${jobDetails.company.name}! Check Status section for updates.` 
          });
        }
        break;
      case 'disconnect':
        toast({ type: 'success', description: `Disconnected from ${targetName}.` });
        break;
      case 'sendMessage':
        toast({ type: 'success', description: `Message sent to ${targetName}!` });
        break;
    }
    
    // Close the message dialog after processing
    setMessageDialog(prev => ({ ...prev, open: false }));
  };

  const handleWhatsAppSend = (message: string, recipients: { students: string[], batches: string[] }) => {
    const totalRecipients = recipients.students.length + recipients.batches.length * 45;
    toast({ type: 'success', description: `WhatsApp messages sent to ${totalRecipients} students!` });
  };

  return (
    <div className="min-h-screen bg-white">
      <style dangerouslySetInnerHTML={{ __html: customTabStyles }} />
      <div className="max-w-screen mx-auto space-y-8 p-6 lg:p-8 bg-white">

       

        {/* Dashboard Overview Cards */}
{/* KPI Cards */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
  {/* New Invitations */}
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-600 font-medium">New Invitations</h3>
      <div className="w-7 h-7 bg-gradient-to-r from-[#00C950] to-[#00A63E] rounded-lg flex items-center justify-center">
        <Users className="w-4 h-4 text-white" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="text-2xl font-semibold text-gray-900">
        {receivedInvitations.filter(inv => inv.status === 'pending').length}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">
          {(() => {
            const pendingCount = receivedInvitations.filter(inv => inv.status === 'pending').length;
            const urgentCount = receivedInvitations.filter(inv => inv.status === 'urgent').length;
            
            if (pendingCount === 0) {
              return 'No invitations';
            } else if (urgentCount > 0) {
              return 'Urgent';
            } else {
              return 'Pending review';
            }
          })()}
        </span>
      </div>
    </div>
  </div>

  {/* Active Jobs */}
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-600 font-medium">Active Jobs</h3>
      <div className="w-7 h-7 bg-gradient-to-r from-[#FF8400] to-[#E57701] rounded-lg flex items-center justify-center">
        <UserCheck className="w-4 h-4 text-white" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="text-2xl font-semibold text-gray-900">{activeConnections.length}</div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">Available Jobs</span>
      </div>
    </div>
  </div>

  {/* Active Connections */}
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-600 font-medium">Active Connections</h3>
      <div className="w-7 h-7 bg-gradient-to-r from-[#FF8400] to-[#E57701] rounded-lg flex items-center justify-center">
        <UserCheck className="w-4 h-4 text-white" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="text-2xl font-semibold text-gray-900">{activeConnections.length}</div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">Partner Connections</span>
      </div>
    </div>
  </div>

  {/* Status */}
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-600 font-medium">Status</h3>
      <div className="w-7 h-7 bg-gradient-to-r from-[#008EFF] to-[#0573CB] rounded-lg flex items-center justify-center">
        <TrendingUp className="w-4 h-4 text-white" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="text-2xl font-semibold text-gray-900">{pendingItems.length}</div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">Awaiting Response</span>
      </div>
    </div>
  </div>
</div>



        <TabButtons
          tabs={[
            { id: 'invitations', label: 'Invitations', showCount: false },
            { id: 'jobs', label: 'Discover Jobs', showCount: false },
            { id: 'companies', label: 'Discover Companies', showCount: false },
            { id: 'pending', label: 'Status', showCount: false }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="mb-8"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsContent value="invitations" className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Invitations</h2>
                <p className="text-slate-600">Review invitations from recruiters and manage shortlisted students</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  className="bg-[#0377EB] hover:bg-[#0377EB]/90 text-white gap-2 rounded-full px-6 py-2.5 h-10 font-medium text-sm"
                >
                  {receivedInvitations.filter(inv => inv.status !== 'shortlisted' && inv.status !== 'interview_scheduled' && inv.status !== 'completed').length} Opportunities
                </Button>
                <Select value={currentFilter} onValueChange={setCurrentFilter}>
                  <SelectTrigger className="w-[180px] bg-white border-[#0377EB] text-[#0377EB] hover:bg-[#0377EB]/10 rounded-lg h-10 font-medium text-sm">
                    <div className="flex items-center gap-2">
                      <Filter className="size-4 text-[#0377EB]" />
                      <SelectValue placeholder="Filter" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {getFilterOptions('invitations').map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {applyFilter(receivedInvitations.filter(inv => inv.status !== 'shortlisted' && inv.status !== 'interview_scheduled' && inv.status !== 'completed'), 'invitations', currentFilter).length > 0 ? (
              <div className="space-y-6">
                {applyFilter(receivedInvitations.filter(inv => inv.status !== 'shortlisted' && inv.status !== 'interview_scheduled' && inv.status !== 'completed'), 'invitations', currentFilter).map((invitation) => (
                  <RecruitmentInvitation
                    key={invitation.id}
                    {...invitation}
                    onAccept={handleAcceptInvitation}
                    onDecline={handleDeclineInvitation}
                    onViewCompany={handleViewCompany}
                    onSendConnection={handleSendConnectionFromInvitation}
                    onSendStudents={() => {}} // No longer needed - invitations go directly to Connected/Partner
                    onNotifyShortlisted={handleNotifyShortlisted}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Mail className="size-8 text-muted-foreground" />}
                title="No invitations yet"
                description="When recruiters send you invitations, they'll appear here for you to review and respond."
              />
            )}
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Discover Jobs</h2>
                <p className="text-slate-600">Explore available job opportunities from partnered companies and connect students</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  className="bg-[#0377EB] hover:bg-[#0377EB]/90 text-white gap-2 rounded-full px-6 py-2.5 h-10 font-medium text-sm"
                >
                  {availableJobs.filter(job => job.status !== 'shortlisted').length} Opportunities
                </Button>
                <Select value={currentFilter} onValueChange={setCurrentFilter}>
                  <SelectTrigger className="w-[180px] bg-white border-[#0377EB] text-[#0377EB] hover:bg-[#0377EB]/10 rounded-lg h-10 font-medium text-sm">
                    <div className="flex items-center gap-2">
                      <Filter className="size-4 text-[#0377EB]" />
                      <SelectValue placeholder="Filter" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {getFilterOptions('jobs').map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {applyFilter(availableJobs.filter(job => job.status !== 'shortlisted'), 'jobs', currentFilter).length > 0 ? (
              <div className="space-y-6">
                {applyFilter(availableJobs.filter(job => job.status !== 'shortlisted'), 'jobs', currentFilter).map((job) => (
                  <JobOpportunity
                    key={job.id}
                    {...job}
                    onRequestInvitation={handleJobRequestInvitation}
                    onSendToRecruiter={handleJobSendToRecruiter}
                    onNotifyStudents={handleJobNotifyStudents}
                    onScheduleInterview={handleJobScheduleInterview}
                    onViewCompany={handleViewCompany}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Briefcase className="size-8 text-muted-foreground" />}
                title="No job opportunities available"
                description="Check back later for new job postings and opportunities from our partner companies."
              />
            )}
          </TabsContent>

          <TabsContent value="companies" className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Discover Companies</h2>
                <p className="text-slate-600">Explore and connect with potential company partners for student placements</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  className="bg-[#0377EB] hover:bg-[#0377EB]/90 text-white gap-2 rounded-full px-6 py-2.5 h-10 font-medium text-sm"
                >
                  {companies.length} Opportunities
                </Button>
                <Select value={currentFilter} onValueChange={setCurrentFilter}>
                  <SelectTrigger className="w-[180px] bg-white border-[#0377EB] text-[#0377EB] hover:bg-[#0377EB]/10 rounded-lg h-10 font-medium text-sm">
                    <div className="flex items-center gap-2">
                      <Filter className="size-4 text-[#0377EB]" />
                      <SelectValue placeholder="Filter" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {getFilterOptions('companies').map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {applyFilter(companies, 'companies', currentFilter).length > 0 ? (
              <div className="space-y-6">
                {applyFilter(companies, 'companies', currentFilter).map((company) => (
                  <CompanyCard
                    key={company.id}
                    {...company}
                    onConnect={handleCompanyConnect}
                    onViewDetails={handleViewCompanyDetails}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Building2 className="size-8 text-muted-foreground" />}
                title="No companies available"
                description="Check back later for new companies looking to partner with colleges for recruitment."
              />
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Status</h2>
                <p className="text-slate-600">Track the status of your connection and invitation requests</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  className="bg-[#0377EB] hover:bg-[#0377EB]/90 text-white gap-2 rounded-full px-6 py-2.5 h-10 font-medium text-sm"
                >
                  {pendingItems.length} Opportunities
                </Button>
                <Select value={currentFilter} onValueChange={setCurrentFilter}>
                  <SelectTrigger className="w-[180px] bg-white border-[#0377EB] text-[#0377EB] hover:bg-[#0377EB]/10 rounded-lg h-10 font-medium text-sm">
                    <div className="flex items-center gap-2">
                      <Filter className="size-4 text-[#0377EB]" />
                      <SelectValue placeholder="Filter" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {getFilterOptions('pending').map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {applyFilter(pendingItems, 'pending', currentFilter).length > 0 ? (
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
                {applyFilter(pendingItems, 'pending', currentFilter).map((request) => (
                  <PendingRequest 
                    key={request.id} 
                    {...request}
                    onWithdraw={handleWithdrawRequest}
                    onViewCompany={handleViewCompanyFromStatus}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Clock className="size-8 text-muted-foreground" />}
                title="No status items"
                description="When you send connection or invitation requests, they'll appear here until they're accepted or declined."
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <MessageDialog
          open={messageDialog.open}
          onOpenChange={(open) => setMessageDialog(prev => ({ ...prev, open }))}
          title={
            messageDialog.type === 'connect' ? 'Connect with Company' : 
            messageDialog.type === 'disconnect' ? 'Disconnect from Connection' :
            messageDialog.type === 'sendMessage' ? 'Send Message' : 'Request Job Invitation'
          }
          description={
            messageDialog.type === 'connect' 
              ? `Send a personalized message to ${messageDialog.targetName} to introduce yourself and explain why you'd like to connect.`
              : messageDialog.type === 'disconnect'
              ? `Send a message to ${messageDialog.targetName} explaining why you're disconnecting (optional).`
              : messageDialog.type === 'sendMessage'
              ? `Send a message to ${messageDialog.targetName}.`
              : `Send a personalized message with your invitation request for ${messageDialog.targetName}.`
          }
          placeholder={
            messageDialog.type === 'connect'
              ? "Hi! I'm interested in learning more about your company and potential opportunities for collaboration..."
              : messageDialog.type === 'disconnect'
              ? "Thank you for the collaboration. We're restructuring our partnerships..."
              : messageDialog.type === 'sendMessage'
              ? "Hi! I wanted to follow up on our recent connection..."
              : "Hi! I'm very interested in this position and would love to be considered. Here's why I'd be a great fit..."
          }
          actionLabel={
            messageDialog.type === 'connect' ? 'Send Connection Request' : 
            messageDialog.type === 'disconnect' ? 'Confirm Disconnect' :
            messageDialog.type === 'sendMessage' ? 'Send Message' : 'Request Invitation'
          }
          onConfirm={handleMessageConfirm}
        />

        <StudentSelectionDialog
          open={studentSelectionDialog.open}
          onOpenChange={(open) => setStudentSelectionDialog(prev => ({ ...prev, open }))}
          jobTitle={studentSelectionDialog.jobTitle}
          companyName={studentSelectionDialog.companyName}
          maxStudents={studentSelectionDialog.maxStudents}
          currentlySelected={[]}
          availableBatches={availableBatches}
          onConfirm={handleStudentSelectionConfirm}
        />

        <WhatsAppDialog
          open={whatsAppDialog.open}
          onOpenChange={(open) => setWhatsAppDialog(prev => ({ ...prev, open }))}
          jobTitle={whatsAppDialog.jobTitle}
          companyName={whatsAppDialog.companyName}
          shortlistedStudents={
            receivedInvitations.find(inv => 
              inv.jobTitle === whatsAppDialog.jobTitle && 
              inv.company.name === whatsAppDialog.companyName
            )?.shortlistedStudents || []
          }
          onSend={handleWhatsAppSend}
        />

        <CompanyDetailsDialog
          open={companyDetailsDialog.open}
          onOpenChange={(open) => setCompanyDetailsDialog(prev => ({ ...prev, open }))}
          company={companyDetailsDialog.company}
          context={companyDetailsDialog.context}
          onAcceptInvitation={handleAcceptInvitation}
          onWithdraw={handleWithdrawRequest}
        />

        <InterviewSchedulingDialog
          open={interviewSchedulingDialog.open}
          onOpenChange={(open) => setInterviewSchedulingDialog(prev => ({ ...prev, open }))}
          connectionName={interviewSchedulingDialog.connectionName}
          jobTitle={interviewSchedulingDialog.jobTitle}
          companyName={interviewSchedulingDialog.companyName}
          shortlistedStudents={interviewSchedulingDialog.shortlistedStudents}
          onConfirm={handleInterviewSchedulingConfirm}
        />

        <StudentsViewDialog
          open={studentsViewDialog.open}
          onOpenChange={(open) => setStudentsViewDialog(prev => ({ ...prev, open }))}
          title={studentsViewDialog.title}
          companyName={studentsViewDialog.companyName}
          students={studentsViewDialog.students}
          jobDetails={studentsViewDialog.jobDetails}
          onNotifyStudents={() => {
            setWhatsAppDialog({
              open: true,
              jobTitle: studentsViewDialog.jobDetails?.title || 'Position',
              companyName: studentsViewDialog.companyName
            });
            setStudentsViewDialog(prev => ({ ...prev, open: false }));
          }}
        />
      </div>
      <Toaster />
    </div>
  );
}