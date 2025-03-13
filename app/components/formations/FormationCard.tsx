import Link from 'next/link';
import Image from 'next/image';
import { Formation } from '../../types';

interface FormationCardProps {
  formation: Formation;
  isFormateur?: boolean;
  onDelete?: (id: string) => void;
}

export default function FormationCard({ formation, isFormateur = false, onDelete }: FormationCardProps) {
  return (
    <div className="card group">
      <div className="relative h-48 w-full bg-gradient-to-r from-indigo-50 to-purple-50 overflow-hidden">
        {formation.image ? (
          <Image
            src={formation.image}
            alt={formation.titre}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="h-16 w-16 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
        
        {/* Badge de statut pour les formateurs */}
        {isFormateur && (
          <div className="absolute top-2 right-2">
            <span className="badge badge-blue">
              Votre formation
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{formation.titre}</h3>
        <div className="mt-2 text-sm text-gray-500 line-clamp-2 h-10">
          <p>{formation.description || "Aucune description disponible"}</p>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/formations/${formation.id}`}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white border border-indigo-700 shadow-[0_3px_0_0_#4338ca,0_3px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_0_0_#4338ca,0_2px_3px_rgba(0,0,0,0.05)] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] active:bg-indigo-700 transition-all duration-75"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Voir
          </Link>
          
          {isFormateur && (
            <>
              <Link
                href={`/formations/edit/${formation.id}`}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-white text-gray-700 border border-gray-700 shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Modifier
              </Link>
              
              <Link
                href={`/formations/gestion/${formation.id}`}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-white text-gray-700 border border-gray-700 shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                </svg>
                Gérer
              </Link>
              
              <button
                onClick={() => onDelete && onDelete(formation.id)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white border border-red-700 shadow-[0_3px_0_0_#b91c1c,0_3px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_0_0_#b91c1c,0_2px_3px_rgba(0,0,0,0.05)] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] active:bg-red-700 transition-all duration-75"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Supprimer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
