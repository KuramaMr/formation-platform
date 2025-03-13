'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Formation } from '../../types';
import useFormations from '../../hooks/useFormations';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface FormationFormProps {
  formation?: Formation;
  isEditing?: boolean;
}

type FormData = {
  titre: string;
  description: string;
  image?: FileList;
};

export default function FormationForm({ formation, isEditing = false }: FormationFormProps) {
  const { user } = useAuth();
  const { createFormation, updateFormation, error: formationError } = useFormations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(formation?.image || null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      titre: formation?.titre || '',
      description: formation?.description || '',
    }
  });
  
  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);
      
      let imageUrl = formation?.image || null;
      
      // Si une nouvelle image a été sélectionnée
      if (data.image && data.image.length > 0) {
        const file = data.image[0];
        const storageRef = ref(storage, `formations/${user?.uid}/${Date.now()}_${file.name}`);
        
        // Uploader l'image
        const snapshot = await uploadBytes(storageRef, file);
        
        // Récupérer l'URL de l'image
        imageUrl = await getDownloadURL(snapshot.ref);
      }
      
      if (isEditing && formation) {
        // Mettre à jour la formation
        await updateFormation(formation.id, {
          titre: data.titre,
          description: data.description,
          image: imageUrl
        });
      } else {
        // Créer une nouvelle formation
        await createFormation({
          titre: data.titre,
          description: data.description,
          image: imageUrl
        });
      }
      
      // Rediriger vers la liste des formations
      router.push('/formations');
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      
      // Vérifier que c'est bien une image
      if (!file.type.startsWith('image/')) {
        setError("Le fichier sélectionné n'est pas une image valide");
        setImagePreview(null);
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.onerror = () => {
        setError("Erreur lors de la lecture du fichier");
        setImagePreview(null);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };
  
  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {(error || formationError) && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error || formationError}
        </div>
      )}
      
      <div>
        <label htmlFor="titre" className="block text-sm font-medium leading-6 text-gray-900">
          Titre de la formation
        </label>
        <div className="mt-2">
          <input
            id="titre"
            type="text"
            {...register('titre', { required: 'Le titre est requis' })}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
          {errors.titre && (
            <p className="mt-1 text-sm text-red-600">{errors.titre.message}</p>
          )}
        </div>
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
          Description
        </label>
        <div className="mt-2">
          <textarea
            id="description"
            rows={4}
            {...register('description', { required: 'La description est requise' })}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
      </div>
      
      <div>
        <label htmlFor="image" className="block text-sm font-medium leading-6 text-gray-900">
          Image (optionnelle)
        </label>
        <div className="mt-2">
          <input
            id="image"
            type="file"
            accept="image/*"
            {...register('image', {
              onChange: (e) => handleImageChange(e)
            })}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
          />
        </div>
        
        {imagePreview && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-900">Aperçu :</p>
            <div className="mt-2 relative h-48 w-full max-w-md">
              <img
                src={imagePreview}
                alt="Aperçu"
                className="object-cover rounded-md h-full w-full"
              />
            </div>
          </div>
        )}
      </div>
      
      <div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-md border border-indigo-700 bg-indigo-600 px-4 py-2 text-white shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)]"
        >
          {loading ? 'Chargement...' : isEditing ? 'Mettre à jour' : 'Créer la formation'}
        </button>
      </div>
    </form>
  );
}
