import { NextRouter } from 'next/router';

export async function handleLoginSuccess(responseData: any, router: NextRouter) {
  if (responseData && responseData.token) {
    localStorage.setItem('token', responseData.token);

    const user = responseData.user || {};

    // Extract studentId if present
    const studentId = user.studentId || '';

    // Redirect based on role and studentId
    const role = user.role || 'student';
    if (role === 'student') {
      router.push(`/dashboard/student${studentId ? `?studentId=${studentId}` : ''}`);
    } else if (role === 'recruiter') {
      router.push(`/dashboard/recruiter?id=${user.id || ''}`);
    } else {
      router.push(`/dashboard/college?id=${user.id || ''}`);
    }
  } else {
    throw new Error('Invalid login response data');
  }
}
