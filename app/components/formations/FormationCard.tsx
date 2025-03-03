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
    <div className="bg-white overflow-hidden shadow rounded-lg">
      {formation.image && (
        <div className="relative h-48 w-full">
          <Image
            src={formation.image}
            alt={formation.titre}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">{formation.titre}</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>{formation.description}</p>
        </div>
        <div className="mt-5 flex space-x-2">
          <Link
            href={`/formations/${formation.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Voir les détails
          </Link>
          
          {isFormateur && (
            <>
              <Link
                href={`/formations/edit/${formation.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Modifier
              </Link>
              
              <button
                onClick={() => onDelete && onDelete(formation.id)}
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
