import React, { useState } from 'react';
import { 
  MessageSquare, 
  Bell, 
  Send, 
  Plus, 
  Search, 
  Users, 
  Calendar,
  Clock,
  User,
  Building,
  CalendarCheck,
  Share,
  Paperclip,
  Phone,
  Video,
  MoreVertical
} from 'lucide-react';

interface Message {
  id: string;
  sender: {
    name: string;
    type: 'company' | 'student' | 'internal';
    avatar?: string;
  };
  content: string;
  timestamp: Date;
  isRead: boolean;
  conversationId: string;
}

interface Conversation {
  id: string;
  participants: Array<{
    name: string;
    type: 'company' | 'student' | 'internal';
    avatar?: string;
  }>;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isActive: boolean;
}

const Communications: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'companies' | 'students'>('all');

  // Mock data for conversations
  const conversations: Conversation[] = [
    {
      id: '1',
      participants: [
        { name: 'Infosys Ltd.', type: 'company' },
      ],
      lastMessage: 'Thank you for scheduling the campus visit. We look forward to meeting your students.',
      lastMessageTime: new Date('2024-10-04T10:30:00'),
      unreadCount: 2,
      isActive: true,
    },
    {
      id: '2',
      participants: [
        { name: 'TCS', type: 'company' },
      ],
      lastMessage: 'Can we discuss the placement drive schedule for next month?',
      lastMessageTime: new Date('2024-10-04T09:15:00'),
      unreadCount: 0,
      isActive: true,
    },
    {
      id: '3',
      participants: [
        { name: 'Wipro Technologies', type: 'company' },
      ],
      lastMessage: 'We would like to partner with your college for internships.',
      lastMessageTime: new Date('2024-10-03T14:20:00'),
      unreadCount: 1,
      isActive: false,
    },
    {
      id: '4',
      participants: [
        { name: 'Rahul Sharma', type: 'student' },
      ],
      lastMessage: 'I have a query regarding the internship application process.',
      lastMessageTime: new Date('2024-10-03T16:45:00'),
      unreadCount: 0,
      isActive: false,
    }
  ];

  // Mock data for messages
  const messages: Message[] = [
    {
      id: '1',
      sender: { name: 'Infosys Ltd.', type: 'company' },
      content: 'Hello! We would like to schedule a campus placement drive for your final year students.',
      timestamp: new Date('2024-10-04T09:00:00'),
      isRead: true,
      conversationId: '1',
    },
    {
      id: '2',
      sender: { name: 'You', type: 'internal' },
      content: 'That sounds great! We have around 200 final year students who would be interested. What dates work for you?',
      timestamp: new Date('2024-10-04T09:15:00'),
      isRead: true,
      conversationId: '1',
    },
    {
      id: '3',
      sender: { name: 'Infosys Ltd.', type: 'company' },
      content: 'We are looking at the first week of November. Could we schedule a visit on November 5th?',
      timestamp: new Date('2024-10-04T10:00:00'),
      isRead: true,
      conversationId: '1',
    },
    {
      id: '4',
      sender: { name: 'Infosys Ltd.', type: 'company' },
      content: 'Thank you for scheduling the campus visit. We look forward to meeting your students.',
      timestamp: new Date('2024-10-04T10:30:00'),
      isRead: false,
      conversationId: '1',
    }
  ];

  // Filter conversations based on search term and active filter
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participants.some(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesFilter = activeFilter === 'all' || 
      (activeFilter === 'companies' && conv.participants[0].type === 'company') ||
      (activeFilter === 'students' && conv.participants[0].type === 'student');
    
    return matchesSearch && matchesFilter;
  });

  // Get messages for selected conversation
  const currentMessages = selectedConversation 
    ? messages.filter(msg => msg.conversationId === selectedConversation)
    : [];

  // Handle sending a message
  const handleSendMessage = () => {
    if (messageInput.trim() && selectedConversation) {
      // In a real app, this would send the message to the backend
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
    <div className="flex h-screen bg-gray-50">
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
              placeholder="Search anything..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeFilter === 'all' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveFilter('companies')}
              className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeFilter === 'companies' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Companies
            </button>
            <button 
              onClick={() => setActiveFilter('students')}
              className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeFilter === 'students' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Students
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
                  selectedConversation === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    {conversation.participants[0].type === 'company' ? (
                      <Building className="w-5 h-5 text-white" />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {conversation.participants[0].name}
                      </h4>
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
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {conversations.find(c => c.id === selectedConversation)?.participants[0].name}
                  </h3>
                  <p className="text-sm text-green-500">● Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  <Video className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
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
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender.name === 'You' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
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
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {/* Right Panel - Quick Actions */}
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        {/* Quick Actions */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
          
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Company Actions</h4>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
                <CalendarCheck className="w-4 h-4 text-blue-600" />
                Schedule Campus Visit
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
                <Share className="w-4 h-4 text-green-600" />
                Share Student List
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
                <User className="w-4 h-4 text-purple-600" />
                View Company Profile
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 font-medium">New company registered</p>
                <p className="text-xs text-gray-500 mt-0.5">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 font-medium">Interview scheduled</p>
                <p className="text-xs text-gray-500 mt-0.5">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 font-medium">Payment reminder sent</p>
                <p className="text-xs text-gray-500 mt-0.5">1 day ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 font-medium">New job posting</p>
                <p className="text-xs text-gray-500 mt-0.5">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Communications;
