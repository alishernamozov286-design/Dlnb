import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Tasks: React.FC = () => {
  const { user } = useAuth();

  // Foydalanuvchi roliga qarab to'g'ri tasks sahifasiga yo'naltirish
  if (user?.role === 'master') {
    return <Navigate to="/app/master/tasks" replace />;
  } else if (user?.role === 'apprentice') {
    return <Navigate to="/app/apprentice/tasks" replace />;
  }

  // Agar rol aniqlanmagan bo'lsa
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Yuklanmoqda...</h2>
        <p className="text-gray-600">Sizning rolingiz aniqlanmoqda...</p>
      </div>
    </div>
  );
};

export default Tasks;