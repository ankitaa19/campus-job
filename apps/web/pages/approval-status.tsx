import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ApprovalStatus from '../components/ApprovalStatus';

export default function ApprovalStatusPage() {
  const router = useRouter();
  const { type } = router.query;
  const [userRole, setUserRole] = useState<'college' | 'recruiter'>('college');

  useEffect(() => {
    // Set user role based on query parameter
    if (type === 'recruiter') {
      setUserRole('recruiter');
    } else {
      setUserRole('college');
    }
  }, [type]);

  return <ApprovalStatus userRole={userRole} />;
}
