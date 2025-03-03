'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import useFormations from '../../../hooks/useFormations';
import FormationForm from '../../../components/formations/FormationForm';
import { Formation } from '../../../types';

export default function EditFormation() {
  const { user, userData, loading: authLoading } = useAuth();
  const { getFormationById, loading: formationLoading, error } = useFormations();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [formation, setFormation] = useState<Formation | null>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    const fetchFormation = async () => {
      if (!mounted || authLoading) return;
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      
      if (userData?.role !== 'formateur') {
        router.push('/formations');
        return;
      }
      
      const result = await getFormationById(id);
      
      if (!result) {
        router.push('/formations');
        return;
      }
      
      // Vérifier que la formation appartient au formateur
      if (result.formateurId !== user.uid) {
        router.push('/formations');
        return;
      }
      
      setFormation(result);
    };
    
    fetchFormation();
  }, [mounted, authLoading, user, userData, id, router]);
  
  if (!mounted || authLoading || formationLoading || !formation) {
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
            Modifier la formation
          </h1>
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="px-4 py-8 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <FormationForm formation={formation} isEditing={true} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
