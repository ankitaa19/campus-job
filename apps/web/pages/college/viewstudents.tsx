'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { API_BASE_URL } from '../../utils/api';

export default function ViewStudents() {
  const router = useRouter();
  const { collegeId } = router.query;
  const [students, setStudents] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!collegeId) return;
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/students`, { params: { collegeId } })
      .then(res => setStudents(res.data))
      .catch(() => setError('Failed to load students.'))
      .finally(() => setLoading(false));
  }, [collegeId]);

  const toggleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  const generateWhatsAppLink = (student: any) => {
    const message = `Hi ${student.firstName}, this is a placement update from your college regarding upcoming company opportunities. Please stay tuned for updates!`;
    return `https://wa.me/${student.phoneNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-6 pt-28 pb-12 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-700 mb-8">Students List</h1>

        {loading && <p className="text-gray-600 mb-4">Loading students...</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {!loading && !error && students.length === 0 && (
          <p className="text-gray-600 mb-4">No students found.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map(student => (
            <div key={student._id} className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition space-y-3">
              <h2 className="text-lg font-semibold text-gray-700">{student.firstName} {student.lastName}</h2>
              <p className="text-sm text-gray-600">Email: {student.email}</p>
              <p className="text-sm text-gray-600">Student ID: {student.studentId}</p>

              <button
                onClick={() => toggleExpand(student._id)}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm"
              >
                {expanded === student._id ? 'Hide Info' : 'View More'}
              </button>

              {expanded === student._id && (
                <div className="bg-gray-100 p-4 rounded space-y-2 text-sm">
                  <p>Date of Birth: {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                  <p>Course: {student.course || 'N/A'}</p>
                  <p>Semester: {student.currentSemester || 'N/A'}</p>
                  <p>Skills: {student.skills?.map((skill: any) => skill.name).join(', ') || 'N/A'}</p>
                  {student.linkedinUrl && (
                    <a href={student.linkedinUrl} target="_blank" className="text-blue-600 underline">LinkedIn Profile</a>
                  )}
                </div>
              )}

              <a
                href={generateWhatsAppLink(student)}
                target="_blank"
                className="w-full block bg-green-500 text-white text-center py-2 rounded hover:bg-green-600 text-sm"
              >
                Message on WhatsApp
              </a>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
