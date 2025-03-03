'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function ResultatsRedirectPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    
    // Rediriger en fonction du rôle de l'utilisateur
    if (userData?.role === 'eleve') {
      router.push('/resultats/eleve');
    } else if (userData?.role === 'formateur') {
      router.push('/resultats/gestion');
    } else {
      // Redirection par défaut
      router.push('/formations');
    }
  }, [user, userData, loading, router]);
  
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
} 