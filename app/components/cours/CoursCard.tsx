import Link from 'next/link';
import { Cours } from '../../types';

interface CoursCardProps {
  cours: Cours;
  isFormateur?: boolean;
  onDelete?: (id: string) => void;
}

export default function CoursCard({ cours, isFormateur = false, onDelete }: CoursCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900">{cours.titre}</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            Cours {cours.ordre}
          </span>
        </div>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>{cours.contenu.substring(0, 150)}...</p>
        </div>
        <div className="mt-5 flex space-x-2">
          <Link
            href={`/cours/${cours.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Voir le cours
          </Link>
          
          {isFormateur && (
            <>
              <Link
                href={`/cours/edit/${cours.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Modifier
              </Link>
              
              <button
                onClick={() => onDelete && onDelete(cours.id)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Supprimer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
