'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import useFormations from '../../../hooks/useFormations';
import useCours from '../../../hooks/useCours';
import useSignatures from '../../../hooks/useSignatures';
import Link from 'next/link';

export default function GestionFormationPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { getFormationById, getStudentsByFormation } = useFormations();
  const { getCoursByFormation } = useCours();
  const { generateSignaturesPDF, loading: signaturesLoading } = useSignatures();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [formation, setFormation] = useState<any>(null);
  const [cours, setCours] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    
    if (userData?.role !== 'formateur') {
      router.push('/formations');
      return;
    }
    
    const fetchData = async () => {
      try {
        const formationData = await getFormationById(id);
        
        if (!formationData) {
          router.push('/formations');
          return;
        }
        
        if (formationData.formateurId !== user.uid) {
          router.push('/formations');
          return;
        }
        
        setFormation(formationData);
        
        const coursData = await getCoursByFormation(id);
        setCours(coursData);
        
        const studentsData = await getStudentsByFormation(id);
        setStudents(studentsData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, user, userData, authLoading, router]);
  
  const handleGenerateSignaturesPDF = async () => {
    if (!formation) return;
    console.log("Génération de PDF pour formation:", formation.id);
    await generateSignaturesPDF(formation.id, formation.titre);
  };
  
  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion de la formation: {formation?.titre}
          </h1>
          
          <div className="flex space-x-3">
            <Link
              href={`/formations/edit/${formation?.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Modifier la formation
            </Link>
            
            <Link
              href={`/cours/create?formationId=${formation?.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Ajouter un cours
            </Link>
            
            <button
              onClick={handleGenerateSignaturesPDF}
              disabled={signaturesLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300"
            >
              {signaturesLoading ? 'Génération...' : 'Télécharger les signatures'}
            </button>
          </div>
        </div>
        
        {/* Le reste du contenu de la page reste inchangé */}
      </div>
    </div>
  );
} 