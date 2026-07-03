import React, { useState, useEffect, useRef } from 'react';

/** ───────────────────────── Types ───────────────────────── */
export type NotificationPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type NotificationStatus = 'unread' | 'read';
export type NotificationCategory = 'enquiry' | 'interview' | 'placement' | 'payment' | 'registration' | 'general';

export interface Notification {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  category: NotificationCategory;
  timestamp: string; // ISO date string
  actionRequired?: boolean;
  metadata?: {
    studentName?: string;
    companyName?: string;
    amount?: string;
    marks?: string;
    packageAmount?: string;
    studentCount?: number;
    interviewTime?: string;
    room?: string;
  };
}

export interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: Notification[];
  onMarkAllRead?: () => void;
  onClearAll?: () => void;
  onMarkAsRead?: (notificationId: string) => void;
  onDismiss?: (notificationId: string) => void;
  onActionClick?: (notification: Notification) => void;
}

/** ─────────────────────── Utilities ─────────────────────── */
const priorityConfig: Record<NotificationPriority, {
  bgColor: string;
  borderColor: string;
  iconBgColor: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
}> = {
  Critical: {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
    iconBgColor: 'bg-red-100',
    textColor: 'text-red-600',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700'
  },
  High: {
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-500',
    iconBgColor: 'bg-yellow-100',
    textColor: 'text-yellow-600',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-700'
  },
  Medium: {
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
    iconBgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700'
  },
  Low: {
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-500',
    iconBgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700'
  }
};

const categoryIcons: Record<NotificationCategory, JSX.Element> = {
  enquiry: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  ),
  interview: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  placement: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  payment: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  ),
  registration: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-5 2v6h6l-6 6V8h-6z"/>
    </svg>
  ),
  general: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  )
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) + ', ' + date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

/** ─────────────────────── Mock Data ─────────────────────── */
const defaultNotifications: Notification[] = [
  {
    id: '1',
    title: 'New High-Priority Enquiry',
    message: 'Rahul Sharma (98% marks) intrested in computer science. Immediate follow-up required!',
    priority: 'Critical',
    status: 'unread',
    category: 'enquiry',
    timestamp: '2025-02-06T12:57:15.000Z',
    actionRequired: true,
    metadata: {
      studentName: 'Rahul Sharma',
      marks: '98%'
    }
  },
  {
    id: '2',
    title: 'Interview Starting in 30 Minutes',
    message: 'TCS campus interview for 25 students starts at 2:00 PM. Room preparation needed.',
    priority: 'High',
    status: 'unread',
    category: 'interview',
    timestamp: '2025-02-10T17:25:10.000Z',
    actionRequired: true,
    metadata: {
      companyName: 'TCS',
      studentCount: 25,
      interviewTime: '2:00 PM'
    }
  },
  {
    id: '3',
    title: 'Placement Confirmed',
    message: 'Priya Patel has accepted the offer from Google (₹15L package).',
    priority: 'Medium',
    status: 'unread',
    category: 'placement',
    timestamp: '2025-02-20T17:25:10.000Z',
    actionRequired: false,
    metadata: {
      studentName: 'Priya Patel',
      companyName: 'Google',
      packageAmount: '₹15L'
    }
  },
  {
    id: '4',
    title: 'Payment Overdue Reminder',
    message: '5 students have overdue fee payments totaling ₹2.4L Send reminders.',
    priority: 'Medium',
    status: 'unread',
    category: 'payment',
    timestamp: '2025-02-24T17:25:10.000Z',
    actionRequired: true,
    metadata: {
      studentCount: 5,
      amount: '₹2.4L'
    }
  },
  {
    id: '5',
    title: 'New Company Registration',
    message: 'Microsoft has registered for campus recruitment. Review their requirements.',
    priority: 'Low',
    status: 'unread',
    category: 'registration',
    timestamp: '2025-02-30T17:25:10.000Z',
    actionRequired: false,
    metadata: {
      companyName: 'Microsoft'
    }
  }
];

/** ─────────────────────── Components ─────────────────────── */
const NotificationItem: React.FC<{
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onActionClick?: (notification: Notification) => void;
}> = ({ notification, onMarkAsRead, onDismiss, onActionClick }) => {
  const config = priorityConfig[notification.priority];
  const icon = categoryIcons[notification.category];

  const handleDismiss = () => {
    onDismiss?.(notification.id);
  };

  const handleActionClick = () => {
    onActionClick?.(notification);
  };

  const handleMarkAsRead = () => {
    if (notification.status === 'unread') {
      onMarkAsRead?.(notification.id);
    }
  };

  return (
    <div 
      className={`flex items-start gap-4 p-6 border-l-4 ${config.borderColor} ${config.bgColor} hover:opacity-90 transition-colors cursor-pointer`}
      onClick={handleMarkAsRead}
    >
      <div className={`flex-shrink-0 w-10 h-10 ${config.iconBgColor} rounded-full flex items-center justify-center mt-1`}>
        <div className={config.textColor}>
          {icon}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-900 leading-5">
            {notification.title}
          </h3>
          <span className={`px-3 py-1 text-sm ${config.badgeBg} ${config.badgeText} rounded-full font-medium flex-shrink-0 ml-3`}>
            {notification.priority}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          {notification.message}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 font-medium">
            {formatTimestamp(notification.timestamp)}
          </span>
          {notification.actionRequired && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleActionClick();
              }}
              className="px-4 py-2 text-sm bg-orange-100 text-orange-700 rounded-full font-semibold hover:bg-orange-200 transition-colors"
            >
              Action Required
            </button>
          )}
        </div>
      </div>
      
      <button 
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-2"
        title="Dismiss notification"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 6L6 18M6 6l12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};

/** ─────────────────────── Main Component ─────────────────────── */
const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications = defaultNotifications,
  onMarkAllRead,
  onClearAll,
  onMarkAsRead,
  onDismiss,
  onActionClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Filter notifications based on search and filter criteria
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'unread' ? notification.status === 'unread' :
      filter === 'urgent' ? (notification.priority === 'Critical' || notification.priority === 'High') : true;
    
    return matchesSearch && matchesFilter;
  });

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const handleMarkAllRead = () => {
    onMarkAllRead?.();
  };

  const handleClearAll = () => {
    onClearAll?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div 
        ref={modalRef}
        className="w-1/2 bg-white rounded-lg shadow-xl max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors p-1"
            aria-label="Close notifications"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-3 p-5 border-b border-gray-100">
          <div className="flex border-grey items-center gap-2 flex-1">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="text"
              placeholder="Search notifications"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-base border-none outline-none bg-transparent text-gray-600 placeholder-gray-400 flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                filter === 'unread' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button 
              onClick={() => setFilter('urgent')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                filter === 'urgent' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Urgent
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 text-base text-blue-500 hover:text-blue-600 transition-colors"
            disabled={unreadCount === 0}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Mark all read
          </button>
          <button 
            onClick={handleClearAll}
            className="flex items-center gap-2 text-base text-red-500 hover:text-red-600 transition-colors"
            disabled={notifications.length === 0}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Clear All
          </button>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto p-4 max-h-[50vh]">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDismiss={onDismiss}
                onActionClick={onActionClick}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <svg className="h-12 w-12 text-gray-400 mb-4" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 17h5l-5-5V9a4 4 0 00-8 0v3l-5 5h5a3 3 0 006 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h3 className="text-sm font-medium text-gray-900 mb-1">No notifications</h3>
              <p className="text-sm text-gray-500 text-center">
                {searchTerm || filter !== 'all' 
                  ? 'No notifications match your current filters.' 
                  : 'You\'re all caught up! No new notifications.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
