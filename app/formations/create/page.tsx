'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import FormationForm from '../../components/formations/FormationForm';

export default function CreateFormation() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Rediriger si l'utilisateur n'est pas connecté ou n'est pas un formateur
    if (!authLoading && mounted) {
      if (!user) {
        router.push('/auth/signin');
      } else if (userData?.role !== 'formateur') {
        router.push('/formations');
      }
    }
  }, [user, userData, authLoading, mounted, router]);
  
  if (!mounted || authLoading || !user || userData?.role !== 'formateur') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
            Créer une nouvelle formation
          </h1>
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <FormationForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
