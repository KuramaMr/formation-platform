'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import useFormations from '../../../hooks/useFormations';
import Link from 'next/link';

export default function GestionFormationPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { getFormationById, getStudentsByFormation, desinscrireEleve } = useFormations();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [formation, setFormation] = useState<any>(null);
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
        
        // Récupérer les élèves inscrits à la formation
        console.log("Récupération des élèves pour la formation:", id);
        const studentsData = await getStudentsByFormation(id);
        console.log("Élèves récupérés:", studentsData);
        setStudents(studentsData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, user, userData, authLoading, router]);
  
  const handleDesinscrireEleve = async (studentId: string, userId: string, studentName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir désinscrire ${studentName} de cette formation ? Toutes ses données (signatures, résultats de quiz) seront supprimées.`)) {
      return;
    }
    
    try {
      setLoading(true);
      const success = await desinscrireEleve(id, userId);
      
      if (success) {
        const updatedStudents = await getStudentsByFormation(id);
        setStudents(updatedStudents);
        alert(`${studentName} a été désinscrit avec succès.`);
      } else {
        alert("Une erreur est survenue lors de la désinscription.");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Une erreur est survenue lors de la désinscription.");
    } finally {
      setLoading(false);
    }
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
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
            Gestion des élèves: {formation?.titre}
          </h1>
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Élèves inscrits à cette formation
              </h2>
              
              {students.length === 0 ? (
                <div>
                  <p className="text-gray-500 mb-4">
                    Aucun élève inscrit à cette formation.
                  </p>
                  <Link
                    href={`/formations/${formation?.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Retour à la formation
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nom
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date d'inscription
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {student.displayName || 'Non spécifié'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {student.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {student.createdAt ? (
                                typeof student.createdAt.toDate === 'function' 
                                  ? new Date(student.createdAt.toDate()).toLocaleDateString('fr-FR') 
                                  : new Date(student.createdAt).toLocaleDateString('fr-FR')
                              ) : 'Non spécifié'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDesinscrireEleve(student.id, student.userId, student.displayName || student.email)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Désinscrire
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 