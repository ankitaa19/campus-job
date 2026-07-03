'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/api';

interface Notification {
  _id: string;
  message: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return setError('You must be logged in to view notifications.');

        const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setNotifications(response.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to fetch notifications.');
      }
    };

    fetchNotifications();
  }, []);

  return (
    <>
      <Navbar />

      <main className="pt-24 px-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Your Notifications</h1>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {notifications.length === 0 ? (
          <p className="text-gray-600">No notifications yet.</p>
        ) : (
          <ul className="space-y-4">
            {notifications.map((note) => (
              <li key={note._id} className="border rounded-md p-4 bg-white shadow-sm">
                <p className="text-gray-800">{note.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(note.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Footer />
    </>
  );
}
