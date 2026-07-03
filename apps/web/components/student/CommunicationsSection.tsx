import React, { useState } from 'react';
import { 
  Send, 
  Plus, 
  Search, 
  Building, 
  User,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  MessageSquare,
  Mail,
  MapPin
} from 'lucide-react';

interface CommunicationsSectionProps {
  studentInfo: any;
}

interface Message {
  id: string;
  sender: {
    name: string;
    type: 'college' | 'company' | 'internal';
  };
  content: string;
  timestamp: Date;
  isRead: boolean;
  conversationId: string;
}

interface Conversation {
  id: string;
  participant: {
    name: string;
    type: 'college' | 'company';
    role?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
}

const CommunicationsSection: React.FC<CommunicationsSectionProps> = ({ studentInfo }) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'college' | 'company'>('college');

  // Mock data for conversations
  const conversations: Conversation[] = [
    {
      id: '1',
      participant: {
        name: 'ABC College',
        type: 'college',
        role: 'Placement Officer',
        email: 'placement@abccollege.edu',
        phone: '+91 9876543210',
        address: 'XYZ Street 105, Bangalore, India'
      },
      lastMessage: 'Hello! We are excited to invite you for campus recruitment',
      lastMessageTime: new Date('2024-11-14T10:30:00'),
      unreadCount: 2,
      isOnline: true,
    },
    {
      id: '2',
      participant: {
        name: 'TechCorp Inc.',
        type: 'company',
        role: 'HR',
        email: 'hr@techcorp.com',
        phone: '+91 9876543211',
        address: '123 Tech Park, Bangalore, India'
      },
      lastMessage: 'Great! We have around 200 students in final year who would be interested.',
      lastMessageTime: new Date('2024-11-14T09:15:00'),
      unreadCount: 0,
      isOnline: true,
    },
    {
      id: '3',
      participant: {
        name: 'Digital Innov.',
        type: 'company',
        role: 'Recruiter',
        email: 'recruiter@digitalinnov.com',
        phone: '+91 9876543212',
        address: '456 Innovation Hub, Mumbai, India'
      },
      lastMessage: 'Thank you for coordinating the placement drive.',
      lastMessageTime: new Date('2024-11-13T14:20:00'),
      unreadCount: 1,
      isOnline: false,
    },
  ];

  // Mock data for messages
  const messages: Message[] = [
    {
      id: '1',
      sender: { name: 'ABC College', type: 'college' },
      content: 'Hello! We are excited to invite you for campus recruitment',
      timestamp: new Date('2024-11-14T09:00:00'),
      isRead: true,
      conversationId: '1',
    },
    {
      id: '2',
      sender: { name: 'You', type: 'internal' },
      content: 'That sounds great! We have around 200 students in final year who would be interested. What dates work for you?',
      timestamp: new Date('2024-11-14T09:15:00'),
      isRead: true,
      conversationId: '1',
    },
    {
      id: '3',
      sender: { name: 'ABC College', type: 'college' },
      content: 'Perfect can we schedule pre placement talk for next week?',
      timestamp: new Date('2024-11-14T10:00:00'),
      isRead: true,
      conversationId: '1',
    },
    {
      id: '4',
      sender: { name: 'ABC College', type: 'college' },
      content: 'Absolutely! I\'ll book the main auditorium. What time works best?',
      timestamp: new Date('2024-11-14T10:30:00'),
      isRead: false,
      conversationId: '1',
    },
    {
      id: '5',
      sender: { name: 'TechCorp Inc.', type: 'company' },
      content: 'We would like to discuss the placement drive schedule for next month.',
      timestamp: new Date('2024-11-14T09:15:00'),
      isRead: true,
      conversationId: '2',
    },
  ];

  // Filter conversations based on search term and active filter
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = conv.participant.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Get messages for selected conversation
  const currentMessages = selectedConversation 
    ? messages.filter(msg => msg.conversationId === selectedConversation)
    : [];

  // Get current conversation details
  const currentConversation = conversations.find(c => c.id === selectedConversation);

  // Handle sending a message
  const handleSendMessage = () => {
    if (messageInput.trim() && selectedConversation) {
      console.log('Sending message:', messageInput);
      setMessageInput('');
    }
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-[#0270DF]">Communications</h1>
        <p className="text-gray-600 text-sm mt-1">Manage your company operations efficiently</p>
      </div>

      <div className="flex h-[calc(100vh-180px)] bg-gray-50">
        {/* Left Panel - Messages List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              <button className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by college..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Filter by department */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">Filter by department</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Department</option>
                <option>Computer Science</option>
                <option>Electronics</option>
                <option>Mechanical</option>
              </select>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveFilter('college')}
                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === 'college' 
                    ? 'bg-[#1484F3] text-[#FFFFFF] shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                College (1)
              </button>
              <button 
                onClick={() => setActiveFilter('company')}
                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === 'company' 
                    ? 'bg-[#1484F3] text-[#FFFFFF] shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Company (2)
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      {conversation.participant.type === 'company' ? (
                        <Building className="w-5 h-5 text-white" />
                      ) : (
                        <Building className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {conversation.participant.name}
                          </h4>
                          <p className="text-xs text-gray-500">{conversation.participant.role}</p>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 ml-2 font-medium">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mb-1">
                        {conversation.lastMessage}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(conversation.lastMessageTime)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center Panel - Chat Area */}
        <div className="flex-1 bg-white flex flex-col">
          {selectedConversation && currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    {currentConversation.participant.type === 'company' ? (
                      <Building className="w-5 h-5 text-white" />
                    ) : (
                      <Building className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {currentConversation.participant.name}
                    </h3>
                    <p className={`text-sm ${currentConversation.isOnline ? 'text-green-500' : 'text-gray-500'}`}>
                      {currentConversation.isOnline ? '● Online now' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors">
                    <Video className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {currentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender.name === 'You' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.sender.name === 'You'
                          ? 'bg-gradient-to-r from-[#2590FB] to-[#0478EB] text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <p className={`text-xs ${
                          message.sender.name === 'You' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                        {message.sender.name === 'You' && message.isRead && (
                          <svg className="w-4 h-4 text-blue-100" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="p-3 bg-gradient-to-r from-[#2590FB] to-[#0478EB] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No Conversation Selected State */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-blue-600 mb-2">No Conversation Available...</h3>
                <p className="text-gray-500">Select a conversation from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Contact Information */}
        {selectedConversation && currentConversation && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            {/* Profile Section */}
            <div className="p-6 text-center border-b border-gray-200">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {currentConversation.participant.name}
              </h2>
              <p className="text-sm text-gray-600 mb-4">{currentConversation.participant.role}</p>
            </div>

            {/* Contact Information */}
            <div className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm text-gray-900 break-all">{currentConversation.participant.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <p className="text-sm text-gray-900">{currentConversation.participant.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Address</p>
                    <p className="text-sm text-gray-900">{currentConversation.participant.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationsSection;
