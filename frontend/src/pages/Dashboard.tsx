import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MasterDashboard from './master/Dashboard';
import ApprenticeDashboard from './apprentice/Dashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Foydalanuvchi roliga qarab to'g'ri panelni ko'rsatish
  if (user?.role === 'master') {
    return <MasterDashboard />;
  } else if (user?.role === 'apprentice') {
    return <ApprenticeDashboard />;
  }

  // Agar rol aniqlanmagan bo'lsa
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Xush kelibsiz!</h2>
        <p className="text-gray-600">Sizning rolingiz aniqlanmoqda...</p>
      </div>
    </div>
  );
};

export default Dashboard;