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
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
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
        const studentsData = await getStudentsByFormation(id);
        setStudents(studentsData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, user, userData, authLoading, router, getFormationById, getStudentsByFormation]);
  
  const handleDesinscrireEleve = async (studentId: string, userId: string, studentName: string) => {
    if (confirmDelete === studentId) {
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
        setConfirmDelete(null);
      }
    } else {
      setConfirmDelete(studentId);
    }
  };
  
  // Filtrer les élèves en fonction du terme de recherche
  const filteredStudents = students.filter(student => 
    student.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const formatDate = (date: any) => {
    if (!date) return 'Date inconnue';
    
    try {
      // Gestion des différents formats de date possibles
      const dateObj = typeof date === 'string' ? new Date(date) : 
                     date.toDate ? date.toDate() : date;
      
      return dateObj.toLocaleDateString('fr-FR');
    } catch (error) {
      return 'Date invalide';
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
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* En-tête avec navigation */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {formation?.title || 'Formation'}
            </h1>
            <p className="text-gray-600">
              Gestion des élèves inscrits
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link 
              href={`/formations/${id}`}
              className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-indigo-600 border border-gray-300 shadow-[0_3px_0_0_#cbd5e1,0_3px_6px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_#cbd5e1,0_2px_3px_rgba(0,0,0,0.1)] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] active:bg-gray-50 transition-all duration-75"
            >
              Retour à la formation
            </Link>
          </div>
        </div>
        
        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              type="text"
              className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="Rechercher un élève..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Élèves inscrits ({students.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              {filteredStudents.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  {searchTerm ? 'Aucun élève ne correspond à votre recherche.' : 'Aucun élève inscrit à cette formation.'}
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 responsive-table">
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
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap" data-label="Nom">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium mr-3">
                              {student.displayName?.charAt(0) || student.email?.charAt(0) || '?'}
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {student.displayName || 'Nom non défini'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Email">
                          {student.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Date d'inscription">
                          {formatDate(student.dateInscription)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" data-label="Actions">
                          {confirmDelete === student.id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleDesinscrireEleve(student.id, student.userId, student.displayName || student.email)}
                                className="text-white bg-red-600 border border-red-700 shadow-[0_3px_0_0_#b91c1c,0_3px_6px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_#b91c1c,0_2px_3px_rgba(0,0,0,0.1)] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] active:bg-red-700 px-3 py-1 rounded-md text-sm font-medium transition-all duration-75"
                              >
                                Confirmer
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="text-gray-700 bg-gray-200 border border-gray-300 shadow-[0_3px_0_0_#cbd5e1,0_3px_6px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_#cbd5e1,0_2px_3px_rgba(0,0,0,0.1)] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] active:bg-gray-300 px-3 py-1 rounded-md text-sm font-medium transition-all duration-75"
                              >
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(student.id)}
                              className="text-red-600 hover:text-red-900 font-medium border border-transparent px-3 py-1 rounded-md shadow-[0_2px_0_0_transparent] hover:border-red-200 hover:shadow-[0_2px_0_0_#fecaca,0_2px_3px_rgba(0,0,0,0.05)] hover:translate-y-[1px] active:shadow-none active:translate-y-[2px] active:bg-red-50 transition-all duration-75"
                            >
                              Désinscrire
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            {/* Pagination (à implémenter si nécessaire) */}
            {filteredStudents.length > 0 && (
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Affichage de <span className="font-medium">{filteredStudents.length}</span> élève(s)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Informations supplémentaires */}
          <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Information importante
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    La désinscription d'un élève supprimera définitivement toutes ses données associées à cette formation (signatures, résultats de quiz, etc.).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 