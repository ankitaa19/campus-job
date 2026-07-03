import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Calendar, MapPin, Briefcase, Award, ExternalLink, Edit2, GraduationCap, Trophy, FileText, Trash2, Link as LinkIcon, CheckCircle, Upload, X, PlusCircle, Search } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface ProfileSectionProps {
  studentInfo: any;
  refreshData: () => void;
}

interface College {
  _id: string;
  name: string;
  location?: string;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ studentInfo, refreshData }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [showProfileImageModal, setShowProfileImageModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showBasicDetailsModal, setShowBasicDetailsModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showSocialLinksModal, setShowSocialLinksModal] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; action: () => void; message: string } | null>(null);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedResume, setSelectedResume] = useState<File | null>(null);
  const [preferences, setPreferences] = useState({
    roles: ['Backend Developer'],
    workType: ['Full-Time'],
    workMode: ['On-Site'],
    locations: ['Delhi', 'Bangaluru']
  });
  const [summary, setSummary] = useState('Creating a concise and compelling message within a 1000-character limit requires careful planning and precision. A 1000-character text includes everything: letters, spaces, and punctuation. It is especially useful for social media posts, meta descriptions, or business communications where space is limited. To write effectively within this limit, start by outlining key points and ensuring each sentence serves a purpose. Be concise, use simple language, and edit thoroughly. Prioritize important information and avoid filler words. With practice, crafting impactful, concise texts becomes easier, helping you communicate clearly without exceeding character restrictions.');
  
  const [roleInput, setRoleInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [workTypeDropdownOpen, setWorkTypeDropdownOpen] = useState(false);
  const [workModeDropdownOpen, setWorkModeDropdownOpen] = useState(false);
  
  const workTypeDropdownRef = useRef<HTMLDivElement>(null);
  const workModeDropdownRef = useRef<HTMLDivElement>(null);
  
  const [languageInput, setLanguageInput] = useState('');
  const [proficiencyInput, setProficiencyInput] = useState('');
  const [languageSkills, setLanguageSkills] = useState({
    read: false,
    write: false,
    speak: false
  });
  const [languages, setLanguages] = useState<Array<{language: string, proficiency: string, skills: string[]}>>([
    { language: 'English', proficiency: 'Proficient', skills: ['Read', 'Write', 'Speak'] },
    { language: 'Hindi', proficiency: 'Expert', skills: ['Read', 'Write', 'Speak'] }
  ]);

  const [phoneNumber, setPhoneNumber] = useState('+91 1011001010');
  const [email, setEmail] = useState('amit.kumar@gmail.com');
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);
  const [showEmailOTP, setShowEmailOTP] = useState(false);
  const [phoneOTP, setPhoneOTP] = useState('');
  const [emailOTP, setEmailOTP] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [isPhoneChanged, setIsPhoneChanged] = useState(false);
  const [isEmailChanged, setIsEmailChanged] = useState(false);

  // College selection states
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [collegeName, setCollegeName] = useState('');
  
  // Basic details form state
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Skills state
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(['JavaScript', 'React', 'Node.js']);

  // Social Links state
  const [socialLinks, setSocialLinks] = useState({
    link1: '',
    link2: '',
    link3: '',
    link4: ''
  });

  // Education state
  const [educationList, setEducationList] = useState<Array<{
    degree: string;
    institution: string;
    startDate: string;
    endDate: string;
    grade: string;
    gradingType: string;
  }>>([]);
  const [editingEducationIndex, setEditingEducationIndex] = useState<number | null>(null);
  const [educationForm, setEducationForm] = useState({
    degree: '',
    institution: '',
    startDate: '',
    endDate: '',
    grade: '',
    gradingType: 'percentage' // 'gpa' or 'percentage'
  });

  // Experience state
  const [experienceList, setExperienceList] = useState<Array<{
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  }>>([]);
  const [editingExperienceIndex, setEditingExperienceIndex] = useState<number | null>(null);
  const [experienceForm, setExperienceForm] = useState({
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  // Achievement state
  const [achievementList, setAchievementList] = useState<Array<{
    title: string;
    description: string;
    year: string;
  }>>([]);
  const [editingAchievementIndex, setEditingAchievementIndex] = useState<number | null>(null);
  const [achievementForm, setAchievementForm] = useState({
    title: '',
    description: '',
    year: ''
  });

  // Project state
  const [projectList, setProjectList] = useState<Array<{
    title: string;
    description: string;
    technologies: string;
    link: string;
  }>>([]);
  const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null);
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    technologies: '',
    link: ''
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workTypeDropdownRef.current && !workTypeDropdownRef.current.contains(event.target as Node)) {
        setWorkTypeDropdownOpen(false);
      }
      if (workModeDropdownRef.current && !workModeDropdownRef.current.contains(event.target as Node)) {
        setWorkModeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize data from studentInfo
  useEffect(() => {
    if (studentInfo) {
      console.log('Profile data received:', studentInfo);
      
      // Set contact info
      const phone = studentInfo.phoneNumber || '+91 1011001010';
      const userEmail = studentInfo.email || 'amit.kumar@gmail.com';
      setPhoneNumber(phone);
      setEmail(userEmail);
      setOriginalPhone(phone);
      setOriginalEmail(userEmail);
      
      // Set full name from firstName and lastName
      const firstName = studentInfo.firstName || '';
      const lastName = studentInfo.lastName || '';
      setFullName(`${firstName} ${lastName}`.trim());
      
      // Set college - handle both collegeId (object/string) and collegeName
      if (studentInfo.collegeId) {
        if (typeof studentInfo.collegeId === 'object' && studentInfo.collegeId._id) {
          setSelectedCollegeId(studentInfo.collegeId._id);
          setCollegeName(studentInfo.collegeId.name || '');
        } else if (typeof studentInfo.collegeId === 'string') {
          setSelectedCollegeId(studentInfo.collegeId);
        }
      }
      
      // Also set collegeName if it exists directly
      if (studentInfo.collegeName && !collegeName) {
        setCollegeName(studentInfo.collegeName);
      }
      
      // Set gender and DOB
      setGender(studentInfo.gender || '');
      if (studentInfo.dateOfBirth) {
        const dob = new Date(studentInfo.dateOfBirth);
        setDateOfBirth(dob.toISOString().split('T')[0]);
      }

      // Load profile image
      if (studentInfo.profilePicture) {
        setSelectedImage(studentInfo.profilePicture);
      }

      // Load social links
      setSocialLinks({
        link1: studentInfo.linkedinUrl || '',
        link2: studentInfo.githubUrl || '',
        link3: studentInfo.portfolioUrl || '',
        link4: '' // Reserved for future use
      });

      // Load summary/bio
      if (studentInfo.resumeAnalysis?.extractedDetails?.personalInfo?.summary) {
        setSummary(studentInfo.resumeAnalysis.extractedDetails.personalInfo.summary);
      }

      // Load preferences from jobPreferences
      if (studentInfo.jobPreferences) {
        setPreferences({
          roles: studentInfo.jobPreferences.jobTypes || [],
          workType: [], // Map from workMode
          workMode: studentInfo.jobPreferences.workMode ? [studentInfo.jobPreferences.workMode] : [],
          locations: studentInfo.jobPreferences.preferredLocations || []
        });
      }

      // Load languages
      if (studentInfo.resumeAnalysis?.extractedDetails?.languages) {
        const loadedLanguages = studentInfo.resumeAnalysis.extractedDetails.languages.map((lang: any) => ({
          language: lang.name || lang.language,
          proficiency: lang.proficiency || 'Proficient',
          skills: ['Read', 'Write', 'Speak'] // Default skills
        }));
        setLanguages(loadedLanguages);
      }

      // Load education
      if (studentInfo.education && studentInfo.education.length > 0) {
        const loadedEducation = studentInfo.education.map((edu: any) => ({
          degree: edu.degree || '',
          institution: edu.institution || '',
          startDate: edu.year ? edu.year.toString() : (edu.startDate ? new Date(edu.startDate).getFullYear().toString() : ''),
          endDate: edu.year ? edu.year.toString() : (edu.endDate ? new Date(edu.endDate).getFullYear().toString() : ''),
          grade: edu.grade || edu.gpa ? (edu.grade || edu.gpa).toString() : '',
          gradingType: edu.gpa ? 'gpa' : 'percentage' // Determine from existing data
        }));
        setEducationList(loadedEducation);
      }

      // Load skills
      if (studentInfo.skills && studentInfo.skills.length > 0) {
        const loadedSkills = studentInfo.skills.map((skill: any) => skill.name || skill);
        setSkills(loadedSkills);
      }

      // Load experience
      if (studentInfo.experience && studentInfo.experience.length > 0) {
        const loadedExperience = studentInfo.experience.map((exp: any) => ({
          title: exp.title || '',
          company: exp.company || '',
          location: exp.location || '',
          startDate: exp.startDate ? new Date(exp.startDate).toISOString().substring(0, 7) : '', // YYYY-MM format for month input
          endDate: exp.endDate ? new Date(exp.endDate).toISOString().substring(0, 7) : '',
          description: exp.description || ''
        }));
        setExperienceList(loadedExperience);
      }

      // Load achievements/certifications
      if (studentInfo.resumeAnalysis?.extractedDetails?.certifications) {
        const loadedAchievements = studentInfo.resumeAnalysis.extractedDetails.certifications.map((cert: any) => ({
          title: cert.name || '',
          description: cert.organization || '',
          year: cert.year ? cert.year.toString() : ''
        }));
        setAchievementList(loadedAchievements);
      }

      // Load projects
      if (studentInfo.resumeAnalysis?.extractedDetails?.projects) {
        const loadedProjects = studentInfo.resumeAnalysis.extractedDetails.projects.map((proj: any) => ({
          title: proj.name || proj.title || '',
          description: proj.description || '',
          technologies: Array.isArray(proj.technologies) ? proj.technologies.join(', ') : '',
          link: proj.link || proj.url || ''
        }));
        setProjectList(loadedProjects);
      }
    }
  }, [studentInfo]);

  // Fetch colleges from database
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/colleges`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setColleges(response.data || []);
      } catch (error) {
        console.error('Error fetching colleges:', error);
      }
    };
    
    fetchColleges();
  }, []);

  // Watch for phone/email changes
  useEffect(() => {
    setIsPhoneChanged(phoneNumber !== originalPhone);
  }, [phoneNumber, originalPhone]);

  useEffect(() => {
    setIsEmailChanged(email !== originalEmail);
  }, [email, originalEmail]);

  const calculateProfileCompleteness = () => {
    if (!studentInfo) return 0;
    const fields = [
      studentInfo?.phoneNumber,
      studentInfo?.dateOfBirth,
      studentInfo?.education?.length > 0,
      studentInfo?.skills?.length > 0,
      studentInfo?.resumeFile,
      studentInfo?.experience?.length > 0,
      studentInfo?.linkedinUrl,
      studentInfo?.portfolioUrl
    ];
    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const completeness = calculateProfileCompleteness();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedResume(file);
    }
  };

  const removeRole = (role: string) => {
    setPreferences({...preferences, roles: preferences.roles.filter(r => r !== role)});
  };

  const removeLocation = (location: string) => {
    setPreferences({...preferences, locations: preferences.locations.filter(l => l !== location)});
  };

  const toggleWorkType = (type: string) => {
    if (preferences.workType.includes(type)) {
      setPreferences({...preferences, workType: preferences.workType.filter(t => t !== type)});
    } else {
      setPreferences({...preferences, workType: [...preferences.workType, type]});
    }
  };

  const toggleWorkMode = (mode: string) => {
    if (preferences.workMode.includes(mode)) {
      setPreferences({...preferences, workMode: preferences.workMode.filter(m => m !== mode)});
    } else {
      setPreferences({...preferences, workMode: [...preferences.workMode, mode]});
    }
  };

  const removeWorkType = (type: string) => {
    setPreferences({...preferences, workType: preferences.workType.filter(t => t !== type)});
  };

  const removeWorkMode = (mode: string) => {
    setPreferences({...preferences, workMode: preferences.workMode.filter(m => m !== mode)});
  };

  const addRole = () => {
    if (roleInput.trim() && preferences.roles.length < 3) {
      setPreferences({...preferences, roles: [...preferences.roles, roleInput.trim()]});
      setRoleInput('');
    }
  };

  const addLocation = () => {
    if (locationInput.trim() && preferences.locations.length < 3) {
      setPreferences({...preferences, locations: [...preferences.locations, locationInput.trim()]});
      setLocationInput('');
    }
  };

  // Skills functions
  const addSkill = async () => {
    if (skillInput.trim()) {
      const newSkills = skillInput.split(',').map(s => s.trim()).filter(s => s);
      const updatedSkills = [...skills, ...newSkills];
      setSkills(updatedSkills);
      setSkillInput('');
      
      // Save to backend immediately with updated skills
      try {
        const token = localStorage.getItem('token');
        const formattedSkills = updatedSkills.map(skill => ({
          name: skill,
          level: 'intermediate',
          category: 'technical'
        }));

        await axios.put(`${API_BASE_URL}/api/students/profile`, 
          { skills: formattedSkills },
          { headers: { Authorization: `Bearer ${token}` }}
        );
        refreshData();
      } catch (error: any) {
        console.error('Error saving skills:', error);
        alert('Failed to save skills');
      }
    }
  };

  const removeSkill = (index: number) => {
    showConfirmation(
      'delete',
      async () => {
        const updated = skills.filter((_, idx) => idx !== index);
        setSkills(updated);
        
        // Save to backend after deletion
        try {
          const token = localStorage.getItem('token');
          const formattedSkills = updated.map(skill => ({
            name: skill,
            level: 'intermediate',
            category: 'technical'
          }));

          await axios.put(`${API_BASE_URL}/api/students/profile`, 
            { skills: formattedSkills },
            { headers: { Authorization: `Bearer ${token}` }}
          );
          refreshData();
        } catch (error: any) {
          console.error('Error saving skills:', error);
          alert('Failed to save skills');
        }
      },
      'Are you sure you want to remove this skill?'
    );
  };

  // Education functions
  const saveEducation = async () => {
    let updatedEducationList;
    
    if (editingEducationIndex !== null) {
      const updated = [...educationList];
      updated[editingEducationIndex] = educationForm;
      updatedEducationList = updated;
      setEducationList(updated);
      setEditingEducationIndex(null);
    } else {
      updatedEducationList = [...educationList, educationForm];
      setEducationList(updatedEducationList);
    }
    
    setEducationForm({ degree: '', institution: '', startDate: '', endDate: '', grade: '', gradingType: 'percentage' });
    
    // Save to backend
    try {
      const token = localStorage.getItem('token');
      const formattedEducation = updatedEducationList.map(edu => {
        const gradeValue = parseFloat(edu.grade);
        return {
          degree: edu.degree,
          field: edu.degree,
          institution: edu.institution,
          year: edu.endDate ? parseInt(edu.endDate) : (edu.startDate ? parseInt(edu.startDate) : new Date().getFullYear()),
          startDate: edu.startDate ? new Date(parseInt(edu.startDate), 0, 1) : new Date(),
          endDate: edu.endDate ? new Date(parseInt(edu.endDate), 0, 1) : undefined,
          grade: edu.gradingType === 'percentage' ? edu.grade : undefined,
          gpa: edu.gradingType === 'gpa' && !isNaN(gradeValue) ? gradeValue : undefined,
          isCompleted: !!edu.endDate
        };
      });

      const response = await axios.put(`${API_BASE_URL}/api/students/profile`, 
        { education: formattedEducation },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.data.success) {
        setShowEducationModal(false);
        refreshData();
        alert('Education updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating education:', error);
      alert('Failed to update education');
    }
  };

  const editEducation = (index: number) => {
    setEditingEducationIndex(index);
    setEducationForm(educationList[index]);
    setShowEducationModal(true);
  };

  const removeEducation = (index: number) => {
    showConfirmation(
      'delete',
      async () => {
        const updated = educationList.filter((_, idx) => idx !== index);
        setEducationList(updated);
        
        // Save to backend after deletion
        try {
          const token = localStorage.getItem('token');
          const formattedEducation = updated.map(edu => {
            const gradeValue = parseFloat(edu.grade);
            return {
              degree: edu.degree,
              field: edu.degree,
              institution: edu.institution,
              year: edu.endDate ? parseInt(edu.endDate) : (edu.startDate ? parseInt(edu.startDate) : new Date().getFullYear()),
              startDate: edu.startDate ? new Date(parseInt(edu.startDate), 0, 1) : new Date(),
              endDate: edu.endDate ? new Date(parseInt(edu.endDate), 0, 1) : undefined,
              grade: edu.gradingType === 'percentage' ? edu.grade : undefined,
              gpa: edu.gradingType === 'gpa' && !isNaN(gradeValue) ? gradeValue : undefined,
              isCompleted: !!edu.endDate
            };
          });

          await axios.put(`${API_BASE_URL}/api/students/profile`, 
            { education: formattedEducation },
            { headers: { Authorization: `Bearer ${token}` }}
          );
          refreshData();
          alert('Education deleted successfully!');
        } catch (error: any) {
          console.error('Error deleting education:', error);
          alert('Failed to delete education');
        }
      },
      'Are you sure you want to delete this education entry? This action cannot be undone.'
    );
  };

  // Experience functions
  const saveExperience = async () => {
    let updatedExperienceList;
    
    if (editingExperienceIndex !== null) {
      const updated = [...experienceList];
      updated[editingExperienceIndex] = experienceForm;
      updatedExperienceList = updated;
      setExperienceList(updated);
      setEditingExperienceIndex(null);
    } else {
      updatedExperienceList = [...experienceList, experienceForm];
      setExperienceList(updatedExperienceList);
    }
    
    setExperienceForm({ title: '', company: '', location: '', startDate: '', endDate: '', description: '' });
    
    // Save to backend
    try {
      const token = localStorage.getItem('token');
      const formattedExperience = updatedExperienceList.map(exp => ({
        title: exp.title,
        company: exp.company,
        location: exp.location || undefined,
        startDate: new Date(exp.startDate),
        endDate: exp.endDate ? new Date(exp.endDate) : undefined,
        description: exp.description,
        isCurrentJob: !exp.endDate
      }));

      const response = await axios.put(`${API_BASE_URL}/api/students/profile`, 
        { experience: formattedExperience },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.data.success) {
        setShowExperienceModal(false);
        refreshData();
        alert('Experience updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating experience:', error);
      alert('Failed to update experience');
    }
  };

  const editExperience = (index: number) => {
    setEditingExperienceIndex(index);
    setExperienceForm(experienceList[index]);
    setShowExperienceModal(true);
  };

  const removeExperience = (index: number) => {
    showConfirmation(
      'delete',
      async () => {
        const updated = experienceList.filter((_, idx) => idx !== index);
        setExperienceList(updated);
        
        // Save to backend after deletion
        try {
          const token = localStorage.getItem('token');
          const formattedExperience = updated.map(exp => ({
            title: exp.title,
            company: exp.company,
            location: exp.location || undefined,
            startDate: new Date(exp.startDate),
            endDate: exp.endDate ? new Date(exp.endDate) : undefined,
            description: exp.description,
            isCurrentJob: !exp.endDate
          }));

          await axios.put(`${API_BASE_URL}/api/students/profile`, 
            { experience: formattedExperience },
            { headers: { Authorization: `Bearer ${token}` }}
          );
          refreshData();
          alert('Experience deleted successfully!');
        } catch (error: any) {
          console.error('Error deleting experience:', error);
          alert('Failed to delete experience');
        }
      },
      'Are you sure you want to delete this experience entry? This action cannot be undone.'
    );
  };

  // Achievement functions
  const saveAchievement = async () => {
    let updatedAchievementList;
    
    if (editingAchievementIndex !== null) {
      const updated = [...achievementList];
      updated[editingAchievementIndex] = achievementForm;
      updatedAchievementList = updated;
      setAchievementList(updated);
      setEditingAchievementIndex(null);
    } else {
      updatedAchievementList = [...achievementList, achievementForm];
      setAchievementList(updatedAchievementList);
    }
    
    setAchievementForm({ title: '', description: '', year: '' });
    
    // Save to backend
    try {
      const token = localStorage.getItem('token');
      const formattedAchievements = updatedAchievementList.map(ach => ({
        name: ach.title,
        year: parseInt(ach.year),
        organization: ach.description
      }));

      const updateData = {
        resumeAnalysis: {
          extractedDetails: {
            certifications: formattedAchievements
          }
        }
      };

      const response = await axios.put(`${API_BASE_URL}/api/students/profile`, 
        updateData,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.data.success) {
        setShowAchievementModal(false);
        refreshData();
        alert('Achievement updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating achievement:', error);
      alert('Failed to update achievement');
    }
  };

  const editAchievement = (index: number) => {
    setEditingAchievementIndex(index);
    setAchievementForm(achievementList[index]);
    setShowAchievementModal(true);
  };

  const removeAchievement = (index: number) => {
    showConfirmation(
      'delete',
      async () => {
        const updated = achievementList.filter((_, idx) => idx !== index);
        setAchievementList(updated);
        
        // Save to backend after deletion
        try {
          const token = localStorage.getItem('token');
          const formattedAchievements = updated.map(ach => ({
            name: ach.title,
            year: parseInt(ach.year),
            organization: ach.description
          }));

          const updateData = {
            resumeAnalysis: {
              extractedDetails: {
                certifications: formattedAchievements
              }
            }
          };

          await axios.put(`${API_BASE_URL}/api/students/profile`, 
            updateData,
            { headers: { Authorization: `Bearer ${token}` }}
          );
          refreshData();
          alert('Achievement deleted successfully!');
        } catch (error: any) {
          console.error('Error deleting achievement:', error);
          alert('Failed to delete achievement');
        }
      },
      'Are you sure you want to delete this achievement? This action cannot be undone.'
    );
  };

  // Project functions
  const saveProject = async () => {
    let updatedProjectList;
    
    if (editingProjectIndex !== null) {
      const updated = [...projectList];
      updated[editingProjectIndex] = projectForm;
      updatedProjectList = updated;
      setProjectList(updated);
      setEditingProjectIndex(null);
    } else {
      updatedProjectList = [...projectList, projectForm];
      setProjectList(updatedProjectList);
    }
    
    setProjectForm({ title: '', description: '', technologies: '', link: '' });
    
    // Save to backend
    try {
      const token = localStorage.getItem('token');
      const formattedProjects = updatedProjectList.map(proj => ({
        name: proj.title,
        description: proj.description,
        technologies: proj.technologies.split(',').map(t => t.trim()),
        link: proj.link || undefined,
        url: proj.link || undefined
      }));

      const updateData = {
        resumeAnalysis: {
          extractedDetails: {
            projects: formattedProjects
          }
        }
      };

      const response = await axios.put(`${API_BASE_URL}/api/students/profile`, 
        updateData,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.data.success) {
        setShowProjectModal(false);
        refreshData();
        alert('Project updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating project:', error);
      alert('Failed to update project');
    }
  };

  const editProject = (index: number) => {
    setEditingProjectIndex(index);
    setProjectForm(projectList[index]);
    setShowProjectModal(true);
  };

  const removeProject = (index: number) => {
    showConfirmation(
      'delete',
      async () => {
        const updated = projectList.filter((_, idx) => idx !== index);
        setProjectList(updated);
        
        // Save to backend after deletion
        try {
          const token = localStorage.getItem('token');
          const formattedProjects = updated.map(proj => ({
            name: proj.title,
            description: proj.description,
            technologies: proj.technologies.split(',').map(t => t.trim())
          }));

          const updateData = {
            resumeAnalysis: {
              extractedDetails: {
                projects: formattedProjects
              }
            }
          };

          await axios.put(`${API_BASE_URL}/api/students/profile`, 
            updateData,
            { headers: { Authorization: `Bearer ${token}` }}
          );
          refreshData();
          alert('Project deleted successfully!');
        } catch (error: any) {
          console.error('Error deleting project:', error);
          alert('Failed to delete project');
        }
      },
      'Are you sure you want to delete this project? This action cannot be undone.'
    );
  };

  // Social Links functions
  const saveSocialLinks = () => {
    // Save social links logic here
    setShowSocialLinksModal(false);
  };

  const addLanguage = () => {
    if (languageInput && proficiencyInput) {
      const skills = [];
      if (languageSkills.read) skills.push('Read');
      if (languageSkills.write) skills.push('Write');
      if (languageSkills.speak) skills.push('Speak');
      
      setLanguages([...languages, { 
        language: languageInput, 
        proficiency: proficiencyInput,
        skills: skills
      }]);
      
      // Reset inputs
      setLanguageInput('');
      setProficiencyInput('');
      setLanguageSkills({ read: false, write: false, speak: false });
    }
  };

  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, idx) => idx !== index));
  };

  const handleGetPhoneOTP = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/auth/send-phone-otp`, 
        { phoneNumber },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setShowPhoneOTP(true);
      alert('OTP sent to your WhatsApp!');
    } catch (error: any) {
      console.error('Error sending phone OTP:', error);
      alert(error.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleGetEmailOTP = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/auth/send-email-otp`, 
        { email },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setShowEmailOTP(true);
      alert('OTP sent to your email!');
    } catch (error: any) {
      console.error('Error sending email OTP:', error);
      alert(error.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyPhoneOTP = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/auth/verify-phone-otp`, 
        { phoneNumber, otp: phoneOTP },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setOriginalPhone(phoneNumber);
      setIsPhoneChanged(false);
      setShowPhoneOTP(false);
      setPhoneOTP('');
      alert('Phone number updated successfully!');
    } catch (error: any) {
      console.error('Error verifying phone OTP:', error);
      alert(error.response?.data?.message || 'Invalid OTP');
    }
  };

  const handleVerifyEmailOTP = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/auth/verify-email-otp`, 
        { email, otp: emailOTP },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setOriginalEmail(email);
      setIsEmailChanged(false);
      setShowEmailOTP(false);
      setEmailOTP('');
      alert('Email updated successfully!');
    } catch (error: any) {
      console.error('Error verifying email OTP:', error);
      alert(error.response?.data?.message || 'Invalid OTP');
    }
  };

  const handleSaveBasicDetails = async () => {
    try {
      // Validate DOB (minimum 3.5 years old - date must be at least 3.5 years in the PAST)
      if (dateOfBirth) {
        const dob = new Date(dateOfBirth);
        const today = new Date();
        const ageInYears = (today.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        
        // If age is LESS than 3.5, they're too young
        if (ageInYears < 3.5) {
          alert('You must be at least 3.5 years old');
          return;
        }
      }
      
      // Validate phone and email OTP if changed
      if (isPhoneChanged && !phoneOTP) {
        alert('Please verify your phone number with OTP');
        return;
      }
      if (isEmailChanged && !emailOTP) {
        alert('Please verify your email with OTP');
        return;
      }
      
      const token = localStorage.getItem('token');
      const updateData: any = {};

      // Split fullName into firstName and lastName for backend
      if (fullName && fullName.trim()) {
        const nameParts = fullName.trim().split(' ');
        updateData.firstName = nameParts[0];
        updateData.lastName = nameParts.slice(1).join(' ') || nameParts[0]; // If no last name, use first name
      }
      
      if (gender) updateData.gender = gender;
      if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth).toISOString();

      // Send collegeId if selected from dropdown (and not "other"), otherwise send collegeName as text
      if (selectedCollegeId && selectedCollegeId !== 'other') {
        updateData.collegeId = selectedCollegeId;
      } else if (collegeName && collegeName.trim()) {
        updateData.collegeName = collegeName.trim();
      }

      // Only include phone/email if not changed or verified
      if (!isPhoneChanged) {
        updateData.phoneNumber = phoneNumber;
      } else if (phoneOTP) {
        updateData.phoneNumber = phoneNumber;
      }
      
      if (!isEmailChanged) {
        updateData.email = email;
      } else if (emailOTP) {
        updateData.email = email;
      }

      console.log('Sending update data:', updateData);

      const response = await axios.put(`${API_BASE_URL}/api/students/profile`, 
        updateData,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      console.log('Update response:', response.data);
      
      if (response.data.success) {
        setShowBasicDetailsModal(false);
        refreshData();
        // Reset OTP states
        setPhoneOTP('');
        setEmailOTP('');
        setShowPhoneOTP(false);
        setShowEmailOTP(false);
        setOriginalPhone(phoneNumber);
        setOriginalEmail(email);
        alert('Profile updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.response?.data?.details 
        || 'Failed to update profile';
      
      alert(typeof errorMessage === 'object' 
        ? JSON.stringify(errorMessage, null, 2) 
        : errorMessage
      );
    }
  };

  // Calculate maximum date for DOB (today - 3.5 years, people younger than this cannot register)
  const getMaxDateOfBirth = () => {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 3, today.getMonth() - 6, today.getDate());
    return maxDate.toISOString().split('T')[0];
  };

  // Social Links Save Handler
  const handleSaveSocialLinks = async () => {
    try {
      const token = localStorage.getItem('token');
      const updateData: any = {
        linkedinUrl: socialLinks.link1,
        githubUrl: socialLinks.link2,
        portfolioUrl: socialLinks.link3
      };

      const response = await axios.put(`${API_BASE_URL}/api/students/profile`, 
        updateData,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.data.success) {
        setShowSocialLinksModal(false);
        refreshData();
        alert('Social links updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating social links:', error);
      alert('Failed to update social links');
    }
  };

  // Summary Save Handler
  const handleSaveSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Create proper nested object structure
      const updateData: any = {
        resumeAnalysis: {
          extractedDetails: {
            personalInfo: {
              summary: summary
            }
          }
        }
      };

      const response = await axios.put(`${API_BASE_URL}/api/students/profile`, 
        updateData,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.data.success) {
        setShowSummaryModal(false);
        refreshData();
        alert('Summary updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating summary:', error);
      alert('Failed to update summary');
    }
  };

  // Preferences Save Handler
  const handleSavePreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const updateData: any = {
        jobPreferences: {
          jobTypes: preferences.roles,
          preferredLocations: preferences.locations,
          workMode: preferences.workMode[0] || 'any'
        }
      };

      const response = await axios.put(`${API_BASE_URL}/api/students/profile`, 
        updateData,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.data.success) {
        setShowPreferencesModal(false);
        refreshData();
        alert('Preferences updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      alert('Failed to update preferences');
    }
  };

  // Languages Save Handler
  const handleSaveLanguages = async () => {
    try {
      const token = localStorage.getItem('token');
      const formattedLanguages = languages.map(lang => ({
        name: lang.language,
        proficiency: lang.proficiency
      }));

      // Create proper nested object structure
      const updateData: any = {
        resumeAnalysis: {
          extractedDetails: {
            languages: formattedLanguages
          }
        }
      };

      const response = await axios.put(`${API_BASE_URL}/api/students/profile`, 
        updateData,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.data.success) {
        setShowLanguageModal(false);
        refreshData();
        alert('Languages updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating languages:', error);
      alert('Failed to update languages');
    }
  };

  // Confirmation Modal Handler
  const showConfirmation = (type: string, action: () => void, message: string) => {
    setConfirmAction({ type, action, message });
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction.action();
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  return (
    <div className="min-h-screen bg-white">
      
      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Confirm Action</h2>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-6">{confirmAction.message}</p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:opacity-90"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Image Modal */}
      {showProfileImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-[#3E9EFE]">Add Profile Image :</h2>
              <button onClick={() => setShowProfileImageModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-4">Upload photo*</p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500">Photo*</span>
                  <label className="px-4 py-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg cursor-pointer hover:opacity-90">
                    Browse
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
                
                {selectedImage ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <img src={selectedImage} alt="Profile" className="w-32 h-32 rounded-full object-cover mb-4" />
                    <p className="text-green-600 text-sm">Image uploaded</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Upload className="h-12 w-12 text-[#3E9EFE] mb-2" />
                    <p className="text-gray-500 text-sm">Image uploaded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resume Upload Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-[#3E9EFE]">Upload Your Resume</h2>
              <button onClick={() => setShowResumeModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-4">Resume</p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4">
                {selectedResume ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-gray-600" />
                      <span className="text-gray-900">{selectedResume.name}</span>
                    </div>
                    <button onClick={() => setSelectedResume(null)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <span className="text-gray-500">Drop your file here</span>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mb-4">(*doc,pdf max file size is 5MB)</p>
              
              {!selectedResume ? (
                <label className="inline-block px-6 py-2 bg-blue-100 text-[#3E9EFE] rounded-lg cursor-pointer hover:bg-blue-200">
                  Upload Resume
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} />
                </label>
              ) : (
                <label className="inline-block px-6 py-2 bg-blue-100 text-[#3E9EFE] rounded-lg cursor-pointer hover:bg-blue-200">
                  Replace Resume
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} />
                </label>
              )}
              
              <div className="flex justify-end mt-6">
                <button className="px-8 py-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg hover:opacity-90">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showPreferencesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-[#3E9EFE]">Add Preferences</h2>
              <button onClick={() => setShowPreferencesModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Role(s) */}
              <div>
                <label className="block text-gray-600 mb-2">Role(s)</label>
                <input 
                  type="text" 
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addRole()}
                  placeholder="Maximum 3 preferred job titles can be selected"
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={preferences.roles.length >= 3}
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {preferences.roles.map((role, idx) => (
                    <span key={idx} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full flex items-center space-x-2 border border-blue-200">
                      <span className="text-sm">{role}</span>
                      <button onClick={() => removeRole(role)} className="text-blue-700 hover:text-blue-900 font-bold">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Job Type */}
              <div ref={workTypeDropdownRef}>
                <label className="block text-gray-600 mb-2">Job Type</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setWorkTypeDropdownOpen(!workTypeDropdownOpen)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-left text-gray-900 flex items-center justify-between"
                  >
                    <span>{preferences.workType.length > 0 ? `${preferences.workType.length} selected` : 'Select Job Type(s)'}</span>
                    <svg className={`w-5 h-5 transition-transform ${workTypeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {workTypeDropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {['Full-Time', 'Part-Time', 'Contract', 'Internship'].map((type) => (
                        <div
                          key={type}
                          onClick={() => toggleWorkType(type)}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                        >
                          <span className="text-gray-900">{type}</span>
                          {preferences.workType.includes(type) && (
                            <svg className="w-5 h-5 text-[#3E9EFE]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Display selected work types as tags */}
                {preferences.workType.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {preferences.workType.map((type, idx) => (
                      <span key={idx} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full flex items-center space-x-2 border border-blue-200">
                        <span className="text-sm">{type}</span>
                        <button onClick={() => removeWorkType(type)} className="text-blue-700 hover:text-blue-900 font-bold">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Work Mode */}
              <div ref={workModeDropdownRef}>
                <label className="block text-gray-600 mb-2">Work Mode</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setWorkModeDropdownOpen(!workModeDropdownOpen)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-left text-gray-900 flex items-center justify-between"
                  >
                    <span>{preferences.workMode.length > 0 ? `${preferences.workMode.length} selected` : 'Select Work Mode(s)'}</span>
                    <svg className={`w-5 h-5 transition-transform ${workModeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {workModeDropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {['On-Site', 'Remote', 'Hybrid'].map((mode) => (
                        <div
                          key={mode}
                          onClick={() => toggleWorkMode(mode)}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                        >
                          <span className="text-gray-900">{mode}</span>
                          {preferences.workMode.includes(mode) && (
                            <svg className="w-5 h-5 text-[#3E9EFE]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Display selected work modes as tags */}
                {preferences.workMode.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {preferences.workMode.map((mode, idx) => (
                      <span key={idx} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full flex items-center space-x-2 border border-blue-200">
                        <span className="text-sm">{mode}</span>
                        <button onClick={() => removeWorkMode(mode)} className="text-blue-700 hover:text-blue-900 font-bold">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Location(s) */}
              <div>
                <label className="block text-gray-600 mb-2">Location(s)</label>
                <input 
                  type="text" 
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addLocation()}
                  placeholder="Maximum 3 preferred locations can be selected"
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={preferences.locations.length >= 3}
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {preferences.locations.map((location, idx) => (
                    <span key={idx} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full flex items-center space-x-2 border border-blue-200">
                      <span className="text-sm">{location}</span>
                      <button onClick={() => removeLocation(location)} className="text-blue-700 hover:text-blue-900 font-bold">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={handleSavePreferences}
                  className="px-12 py-3 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg hover:opacity-90 font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary (Bio) Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-[#3E9EFE]">Summary (Bio)</h2>
              <button onClick={() => setShowSummaryModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <label className="block text-gray-600 mb-2">Description</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Write description..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px] resize-none"
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-2">Max {summary.length}/1000 character</p>

              <div className="flex justify-end mt-6">
                <button 
                  onClick={handleSaveSummary}
                  className="px-8 py-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg hover:opacity-90"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Basic Details Modal */}
      {showBasicDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-semibold text-[#3E9EFE]">Basic Details</h2>
              <button onClick={() => setShowBasicDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-600 mb-2">
                    Full Name<span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-2">
                    Phone<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="tel" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 1011001010"
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {isPhoneChanged && (
                    <>
                      <p className="text-xs text-gray-600 mt-2">We'll send a 6-digit OTP on your WhatsApp</p>
                      {!showPhoneOTP ? (
                        <button 
                          onClick={handleGetPhoneOTP}
                          type="button"
                          className="mt-2 px-6 py-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg hover:opacity-90 text-sm font-medium"
                        >
                          Get OTP
                        </button>
                      ) : (
                        <div className="mt-2 flex gap-2">
                          <input 
                            type="text" 
                            value={phoneOTP}
                            onChange={(e) => setPhoneOTP(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={handleVerifyPhoneOTP}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                          >
                            Verify
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-gray-600 mb-2">
                    Email<span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="amit.kumar@gmail.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {isEmailChanged && (
                    <>
                      <p className="text-xs text-gray-600 mt-2">We'll send a 6-digit OTP to verify your email</p>
                      {!showEmailOTP ? (
                        <button 
                          onClick={handleGetEmailOTP}
                          type="button"
                          className="mt-2 px-6 py-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg hover:opacity-90 text-sm font-medium"
                        >
                          Get OTP
                        </button>
                      ) : (
                        <div className="mt-2 flex gap-2">
                          <input 
                            type="text" 
                            value={emailOTP}
                            onChange={(e) => setEmailOTP(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={handleVerifyEmailOTP}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                          >
                            Verify
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-gray-600 mb-2">
                    Gender<span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-600 mb-2">
                    Date of Birth<span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={getMaxDateOfBirth()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be at least 3.5 years old</p>
                </div>

                <div>
                  <label className="block text-gray-600 mb-2">
                    College<span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedCollegeId}
                    onChange={(e) => {
                      const collegeId = e.target.value;
                      setSelectedCollegeId(collegeId);
                      if (collegeId === 'other') {
                        setCollegeName('');
                      } else {
                        const college = colleges.find(c => c._id === collegeId);
                        if (college) {
                          setCollegeName(college.name);
                        }
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">Select your college</option>
                    {colleges.map((college) => (
                      <option key={college._id} value={college._id}>
                        {college.name}
                        {college.location ? ` - ${college.location}` : ''}
                      </option>
                    ))}
                    <option value="other">Other (Enter manually)</option>
                  </select>
                  
                  {/* Show text input when "Other" is selected or no selection made */}
                  {(selectedCollegeId === '' || selectedCollegeId === 'other') && (
                    <div className="mt-3">
                      <label className="block text-gray-500 text-sm mb-2">
                        {selectedCollegeId === 'other' ? 'Enter your college name:' : 'Or enter college name manually:'}
                      </label>
                      <input
                        type="text"
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                        placeholder="Type your college name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button 
                  onClick={handleSaveBasicDetails}
                  className="px-12 py-3 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg hover:opacity-90 font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-[#3E9EFE]">Add Language</h2>
              <button onClick={() => setShowLanguageModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Display existing languages */}
              {languages.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">Added Languages:</h3>
                  {languages.map((lang, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <span className="font-medium text-gray-900">{lang.language}</span>
                          <span className="text-sm text-gray-600">• {lang.proficiency}</span>
                          <span className="text-sm text-gray-500">• {lang.skills.join(', ')}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeLanguage(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new language form */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Add New Language:</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-600 mb-2">
                      Language<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      placeholder="Enter language (e.g., English, Hindi)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-4 mt-3">
                      <label className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={languageSkills.read}
                          onChange={(e) => setLanguageSkills({...languageSkills, read: e.target.checked})}
                          className="w-4 h-4 text-[#3E9EFE] border-gray-300 rounded" 
                        />
                        <span className="text-gray-600">Read</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={languageSkills.write}
                          onChange={(e) => setLanguageSkills({...languageSkills, write: e.target.checked})}
                          className="w-4 h-4 text-[#3E9EFE] border-gray-300 rounded" 
                        />
                        <span className="text-gray-600">Write</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={languageSkills.speak}
                          onChange={(e) => setLanguageSkills({...languageSkills, speak: e.target.checked})}
                          className="w-4 h-4 text-[#3E9EFE] border-gray-300 rounded" 
                        />
                        <span className="text-gray-600">Speak</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-2">
                      Proficiency<span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={proficiencyInput}
                      onChange={(e) => setProficiencyInput(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="">Select proficiency</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Proficient">Proficient</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={addLanguage}
                  disabled={!languageInput || !proficiencyInput}
                  className="mt-4 px-6 py-2 bg-blue-100 text-[#3E9EFE] rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Language
                </button>
              </div>

              <div className="flex justify-end border-t border-gray-200 pt-6">
                <button 
                  onClick={handleSaveLanguages}
                  className="px-12 py-3 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg hover:opacity-90 font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Social Links Modal */}
      {showSocialLinksModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-[#3E9EFE]">Social Links</h2>
              <button onClick={() => setShowSocialLinksModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-600 mb-2">LinkedIn Profile</label>
                  <input 
                    type="url" 
                    value={socialLinks.link1}
                    onChange={(e) => setSocialLinks({...socialLinks, link1: e.target.value})}
                    placeholder="Paste your LinkedIn URL"
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">GitHub Profile</label>
                  <input 
                    type="url" 
                    value={socialLinks.link2}
                    onChange={(e) => setSocialLinks({...socialLinks, link2: e.target.value})}
                    placeholder="Paste your GitHub URL"
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">Portfolio/Website</label>
                  <input 
                    type="url" 
                    value={socialLinks.link3}
                    onChange={(e) => setSocialLinks({...socialLinks, link3: e.target.value})}
                    placeholder="Paste your portfolio URL"
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">Other Profile</label>
                  <input 
                    type="url" 
                    value={socialLinks.link4}
                    onChange={(e) => setSocialLinks({...socialLinks, link4: e.target.value})}
                    placeholder="Paste other profile URL"
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button 
                  onClick={handleSaveSocialLinks}
                  className="px-12 py-3 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg hover:opacity-90 font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Education Modal */}
      {showEducationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-semibold text-[#3E9EFE]">
                {editingEducationIndex !== null ? 'Edit Education' : 'Add Education'}
              </h2>
              <button onClick={() => {
                setShowEducationModal(false);
                setEditingEducationIndex(null);
                setEducationForm({ degree: '', institution: '', startDate: '', endDate: '', grade: '', gradingType: 'percentage' });
              }} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-600 mb-2">Degree/Class</label>
                <input 
                  type="text" 
                  value={educationForm.degree}
                  onChange={(e) => setEducationForm({...educationForm, degree: e.target.value})}
                  placeholder="e.g., Class X, B.Tech"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-2">School/College Name</label>
                <input 
                  type="text" 
                  value={educationForm.institution}
                  onChange={(e) => setEducationForm({...educationForm, institution: e.target.value})}
                  placeholder="Enter institution name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 mb-2">Start Year</label>
                  <input 
                    type="text" 
                    value={educationForm.startDate}
                    onChange={(e) => setEducationForm({...educationForm, startDate: e.target.value})}
                    placeholder="2019"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">End Year</label>
                  <input 
                    type="text" 
                    value={educationForm.endDate}
                    onChange={(e) => setEducationForm({...educationForm, endDate: e.target.value})}
                    placeholder="2023"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-2">Grading Type</label>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="gradingType"
                      value="gpa"
                      checked={educationForm.gradingType === 'gpa'}
                      onChange={(e) => setEducationForm({...educationForm, gradingType: e.target.value})}
                      className="mr-2"
                    />
                    <span className="text-gray-700">GPA (out of 10)</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="gradingType"
                      value="percentage"
                      checked={educationForm.gradingType === 'percentage'}
                      onChange={(e) => setEducationForm({...educationForm, gradingType: e.target.value})}
                      className="mr-2"
                    />
                    <span className="text-gray-700">Percentage</span>
                  </label>
                </div>
                <input 
                  type="text" 
                  value={educationForm.grade}
                  onChange={(e) => setEducationForm({...educationForm, grade: e.target.value})}
                  placeholder={educationForm.gradingType === 'gpa' ? 'e.g., 8.5' : 'e.g., 95%'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end mt-6">
                <button 
                  onClick={saveEducation}
                  className="px-8 py-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg hover:opacity-90"
                >
                  {editingEducationIndex !== null ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skills Modal */}
      {showSkillsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-[#3E9EFE]">Add Skills</h2>
              <button onClick={() => setShowSkillsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-600 mb-2">Skill Name</label>
                <input 
                  type="text" 
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  placeholder="e.g., JavaScript, Python, React (comma separated for multiple)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Tip: Add multiple skills by separating them with commas</p>
              </div>

              <div className="flex justify-end mt-6">
                <button 
                  onClick={addSkill}
                  className="px-8 py-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg hover:opacity-90"
                >
                  Add Skill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Experience Modal */}
      {showExperienceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-semibold text-[#3E9EFE]">
                {editingExperienceIndex !== null ? 'Edit Experience' : 'Add Experience'}
              </h2>
              <button onClick={() => {
                setShowExperienceModal(false);
                setEditingExperienceIndex(null);
                setExperienceForm({ title: '', company: '', location: '', startDate: '', endDate: '', description: '' });
              }} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-600 mb-2">Job Title</label>
                <input 
                  type="text"
                  value={experienceForm.title}
                  onChange={(e) => setExperienceForm({...experienceForm, title: e.target.value})}
                  placeholder="e.g., Software Development Intern"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-2">Company Name</label>
                <input 
                  type="text"
                  value={experienceForm.company}
                  onChange={(e) => setExperienceForm({...experienceForm, company: e.target.value})}
                  placeholder="Enter company name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-2">Location</label>
                <input 
                  type="text"
                  value={experienceForm.location}
                  onChange={(e) => setExperienceForm({...experienceForm, location: e.target.value})}
                  placeholder="e.g., Mumbai, India or Remote"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 mb-2">Start Date</label>
                  <input 
                    type="month"
                    value={experienceForm.startDate}
                    onChange={(e) => setExperienceForm({...experienceForm, startDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">End Date</label>
                  <input 
                    type="month"
                    value={experienceForm.endDate}
                    onChange={(e) => setExperienceForm({...experienceForm, endDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-2">Description</label>
                <textarea
                  value={experienceForm.description}
                  onChange={(e) => setExperienceForm({...experienceForm, description: e.target.value})}
                  placeholder="Describe your responsibilities and achievements..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] resize-none"
                  maxLength={1000}
                />
              </div>

              <div className="flex justify-end mt-6">
                <button 
                  onClick={saveExperience}
                  className="px-8 py-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg hover:opacity-90"
                >
                  {editingExperienceIndex !== null ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Modal */}
      {showAchievementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-semibold text-[#3E9EFE]">
                {editingAchievementIndex !== null ? 'Edit Achievement' : 'Add Achievement'}
              </h2>
              <button onClick={() => {
                setShowAchievementModal(false);
                setEditingAchievementIndex(null);
                setAchievementForm({ title: '', description: '', year: '' });
              }} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-600 mb-2">Achievement Title</label>
                <input 
                  type="text" 
                  value={achievementForm.title}
                  onChange={(e) => setAchievementForm({...achievementForm, title: e.target.value})}
                  placeholder="e.g., Winner - Smart Indian Hackathon"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-2">Year</label>
                <input 
                  type="text" 
                  value={achievementForm.year}
                  onChange={(e) => setAchievementForm({...achievementForm, year: e.target.value})}
                  placeholder="e.g., 2024"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-2">Description</label>
                <textarea
                  value={achievementForm.description}
                  onChange={(e) => setAchievementForm({...achievementForm, description: e.target.value})}
                  placeholder="Describe your achievement..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] resize-none"
                  maxLength={1000}
                />
              </div>

              <div className="flex justify-end mt-6">
                <button 
                  onClick={saveAchievement}
                  className="px-8 py-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg hover:opacity-90"
                >
                  {editingAchievementIndex !== null ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-semibold text-[#3E9EFE]">
                {editingProjectIndex !== null ? 'Edit Project' : 'Add Project'}
              </h2>
              <button onClick={() => {
                setShowProjectModal(false);
                setEditingProjectIndex(null);
                setProjectForm({ title: '', description: '', technologies: '', link: '' });
              }} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-600 mb-2">Project Title</label>
                <input 
                  type="text"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({...projectForm, title: e.target.value})}
                  placeholder="Enter project name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-2">Project URL</label>
                <input 
                  type="url"
                  value={projectForm.link}
                  onChange={(e) => setProjectForm({...projectForm, link: e.target.value})}
                  placeholder="https://yourproject.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-2">Technologies Used</label>
                <input 
                  type="text"
                  value={projectForm.technologies}
                  onChange={(e) => setProjectForm({...projectForm, technologies: e.target.value})}
                  placeholder="e.g., React, Node.js, MongoDB"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-2">Description</label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                  placeholder="Describe your project..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] resize-none"
                  maxLength={1000}
                />
              </div>

              <div className="flex justify-end mt-6">
                <button 
                  onClick={saveProject}
                  className="px-8 py-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg hover:opacity-90"
                >
                  {editingProjectIndex !== null ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">My <span className="text-[#3E9EFE]">Profile !</span></h1>
        <p className="text-gray-600 text-sm mt-1">Manage your personal information and preferences</p>
      </div>

      <div className="px-8 py-6">

      {/* Profile Strength Card */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-gray-900">Profile Strength: {completeness}%</h3>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 mb-3">Complete your profile to increase visibility to recruiters</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#3E9EFE] h-2 rounded-full transition-all duration-300" 
                style={{ width: `${completeness}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Add your projects and certifications to reach 100%</p>
          </div>
        </div>
      </div>

      {/* Main Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar - Profile Card */}
        <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Profile Image */}
            <div className="p-6 text-center border-b border-gray-200">
              <div className="relative inline-block">
                <div className="w-28 h-28 bg-gray-200 rounded-full flex items-center justify-center mx-auto overflow-hidden">
                  {selectedImage ? (
                    <img src={selectedImage} alt="Profile" className="w-28 h-28 rounded-full object-cover" />
                  ) : (
                    <User className="h-14 w-14 text-gray-400" />
                  )}
                </div>
                <button 
                  onClick={() => setShowProfileImageModal(true)}
                  className="absolute bottom-0 right-0 w-9 h-9 bg-[#3E9EFE] rounded-full flex items-center justify-center text-white hover:bg-blue-700 shadow-lg"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mt-4">
                {studentInfo?.firstName || 'Amit'} {studentInfo?.lastName || 'Kumar'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {(typeof studentInfo?.collegeId === 'object' && studentInfo?.collegeId?.name) 
                  ? studentInfo.collegeId.name 
                  : (studentInfo?.collegeName || 'ABC University')}
              </p>
            </div>

            {/* Social Links */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Social Links</h3>
                <button 
                  onClick={() => setShowSocialLinksModal(true)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                {socialLinks.link1 && (
                  <a 
                    href={socialLinks.link1} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <LinkIcon className="h-4 w-4 text-[#3E9EFE] flex-shrink-0" />
                      <span className="text-sm text-[#3E9EFE] font-medium truncate">LinkedIn</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-[#3E9EFE] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
                
                {socialLinks.link2 && (
                  <a 
                    href={socialLinks.link2} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <LinkIcon className="h-4 w-4 text-[#3E9EFE] flex-shrink-0" />
                      <span className="text-sm text-[#3E9EFE] font-medium truncate">GitHub</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-[#3E9EFE] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
                
                {socialLinks.link3 && (
                  <a 
                    href={socialLinks.link3} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <LinkIcon className="h-4 w-4 text-[#3E9EFE] flex-shrink-0" />
                      <span className="text-sm text-[#3E9EFE] font-medium truncate">Portfolio</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-[#3E9EFE] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}

                {!socialLinks.link1 && !socialLinks.link2 && !socialLinks.link3 && (
                  <p className="text-sm text-gray-500 text-center py-4">No social links added yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-9">
          
 {/* Tabs */}
<div className="relative w-full -mt-2">
  {/* Grey tray line (thicker now) */}
  <div className="absolute bottom-0 left-0 w-full h-[4px] bg-[#B8BBD2]"></div>

  <div className="flex relative">
    {/* Basic Details */}
    <button
      onClick={() => setActiveTab('basic')}
      className={`w-full px-2 py-3 text-base whitespace-nowrap text-black font-medium relative`}
    >
      Basic Details
      {activeTab === 'basic' && (
        <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-[#1383F3]"></div>
      )}
    </button>

    {/* Education & Skills */}
    <button
      onClick={() => setActiveTab('education')}
      className={`w-full px-2 py-3 text-base whitespace-nowrap text-black font-medium relative`}
    >
      Education & Skills
      {activeTab === 'education' && (
        <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-[#1383F3]"></div>
      )}
    </button>

    {/* Experience */}
    <button
      onClick={() => setActiveTab('experience')}
      className={`w-full px-2 py-3 text-base whitespace-nowrap text-black font-medium relative`}
    >
      Experience
      {activeTab === 'experience' && (
        <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-[#1383F3]"></div>
      )}
    </button>

    {/* Achievements & Projects */}
    <button
      onClick={() => setActiveTab('achievements')}
      className={`w-full px-2 py-3 text-base whitespace-nowrap text-black font-medium relative`}
    >
      Achievements & Projects
      {activeTab === 'achievements' && (
        <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-[#1383F3]"></div>
      )}
    </button>
  </div>
</div>


          {/* Tab Content */}
          <div className="mt-6">
            
            {/* Basic Details Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                
                {/* Basic Details Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Basic Details</h3>
                    <button 
                      onClick={() => setShowBasicDetailsModal(true)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Full Name:</p>
                      <p className="text-sm font-medium text-gray-900">
                        {studentInfo?.firstName || 'Amit'} {studentInfo?.lastName || 'Kumar'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Phone:</p>
                      <p className="text-sm font-medium text-gray-900">
                        {studentInfo?.phoneNumber || '+91 1010101010'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Date of Birth:</p>
                      <p className="text-sm font-medium text-gray-900">
                        {studentInfo?.dateOfBirth 
                          ? new Date(studentInfo.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                          : '15 December, 2008'
                        }
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email:</p>
                      <p className="text-sm font-medium text-gray-900">
                        {studentInfo?.email || 'amit.kumar@gmail.com'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Gender:</p>
                      <p className="text-sm font-medium text-gray-900">
                        {studentInfo?.gender ? studentInfo.gender.charAt(0).toUpperCase() + studentInfo.gender.slice(1) : 'Not specified'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-1">College:</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {(typeof studentInfo?.collegeId === 'object' && studentInfo?.collegeId?.name) 
                            ? studentInfo.collegeId.name 
                            : (studentInfo?.collegeName || 'Not specified')}
                        </p>
                        <ExternalLink className="h-3 w-3 text-[#3E9EFE] cursor-pointer" />
                      </div>
                    </div>
                  </div>
                </div>


                {/* Resume Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#3E9EFE]">Resume</h3>
                    <button 
                      onClick={() => setShowResumeModal(true)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-50 rounded flex items-center justify-center">
                        <FileText className="h-6 w-6 text-red-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedResume ? selectedResume.name : 'Lorem.pdf'}
                      </span>
                    </div>
                    <button 
                      onClick={() => setSelectedResume(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">(*Upload max file size is 5MB)</p>
                </div>

                {/* Summary Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Summary (Bio)</h3>
                    <button 
                      onClick={() => setShowSummaryModal(true)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {summary}
                  </p>
                </div>

                {/* Preferences Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Preferences</h3>
                    <button 
                      onClick={() => setShowPreferencesModal(true)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Role</p>
                      <p className="text-sm font-medium text-gray-900">{preferences.roles.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Work Type</p>
                      <p className="text-sm font-medium text-gray-900">{preferences.workType.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Work Mode</p>
                      <p className="text-sm font-medium text-gray-900">{preferences.workMode.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Location</p>
                      <p className="text-sm font-medium text-gray-900">{preferences.locations.join(', ')}</p>
                    </div>
                  </div>
                </div>

                {/* Language Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Language</h3>
                    <button 
                      onClick={() => setShowLanguageModal(true)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <PlusCircle className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {languages.map((lang, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <p className="text-sm font-semibold text-gray-900">{lang.language}</p>
                            <span className="text-xs text-gray-400">•</span>
                            <p className="text-sm text-gray-600">{lang.proficiency}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => setShowLanguageModal(true)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => removeLanguage(idx)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Education & Skills Tab */}
            {activeTab === 'education' && (
              <div className="space-y-6">
                
                {/* Education Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="h-5 w-5 text-gray-700" />
                      <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                    </div>
                    <button 
                      onClick={() => {
                        setEditingEducationIndex(null);
                        setEducationForm({ degree: '', institution: '', startDate: '', endDate: '', grade: '', gradingType: 'percentage' });
                        setShowEducationModal(true);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <PlusCircle className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {educationList.length > 0 ? (
                      educationList.map((edu, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="text-sm font-semibold text-gray-900">{edu.degree}</h4>
                                <ExternalLink className="h-4 w-4 text-gray-400 cursor-pointer" />
                              </div>
                              <p className="text-xs text-gray-600 mb-2">{edu.institution}</p>
                              <div className="flex items-center space-x-4">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">{edu.startDate} - {edu.endDate}</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">Grade: {edu.grade}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => editEducation(idx)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => removeEducation(idx)}
                                className="text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No education records added yet</p>
                    )}
                  </div>
                </div>

                {/* Skills Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
                    <button 
                      onClick={() => setShowSkillsModal(true)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <PlusCircle className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-md flex items-center space-x-2">
                        <span>{skill}</span>
                        <button onClick={() => removeSkill(idx)} className="text-blue-700 hover:text-blue-900">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="h-5 w-5 text-gray-700" />
                      <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
                    </div>
                    <button 
                      onClick={() => {
                        setEditingExperienceIndex(null);
                        setExperienceForm({ title: '', company: '', location: '', startDate: '', endDate: '', description: '' });
                        setShowExperienceModal(true);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <PlusCircle className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Map through experience list */}
                  <div className="space-y-4">
                  {experienceList.map((exp, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-sm font-semibold text-gray-900">{exp.title}</h4>
                            <ExternalLink className="h-4 w-4 text-gray-400 cursor-pointer" />
                            <button 
                              onClick={() => editExperience(index)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => removeExperience(index)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{exp.company}</p>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span>Start Date: {exp.startDate}</span>
                            <span>End Date: {exp.endDate}</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {exp.description}
                      </p>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            )}

            {/* Achievements & Projects Tab */}
            {activeTab === 'achievements' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Achievements Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-5 w-5 text-gray-700" />
                      <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
                    </div>
                    <button 
                      onClick={() => {
                        setEditingAchievementIndex(null);
                        setAchievementForm({ title: '', description: '', year: '' });
                        setShowAchievementModal(true);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <PlusCircle className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Map through achievement list */}
                  <div className="space-y-4">
                  {achievementList.map((ach, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start space-x-2 mb-3">
                        <Trophy className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-semibold text-gray-900">{ach.title}</h4>
                            <button 
                              onClick={() => editAchievement(index)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => removeAchievement(index)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          {ach.year && <p className="text-xs text-gray-600 mt-1">Year: {ach.year}</p>}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {ach.description}
                      </p>
                    </div>
                  ))}
                  </div>
                </div>

                {/* Projects Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-gray-700" />
                      <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
                    </div>
                    <button 
                      onClick={() => {
                        setEditingProjectIndex(null);
                        setProjectForm({ title: '', description: '', technologies: '', link: '' });
                        setShowProjectModal(true);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <PlusCircle className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Map through project list */}
                  <div className="space-y-4">
                  {projectList.map((proj, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">{proj.title}</h4>
                          {proj.link && (
                            <div className="flex items-center space-x-3 text-xs text-gray-600 mb-3">
                              <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-[#3E9EFE] hover:text-blue-700 flex items-center space-x-1">
                                <span>{proj.link}</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                          {proj.technologies && (
                            <p className="text-xs text-gray-600 mb-2">Technologies: {proj.technologies}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => editProject(index)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => removeProject(index)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {proj.description}
                      </p>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      </div>
    </div>
  );
};

export default ProfileSection;
