'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { Cours } from '../../types';
import useCours from '../../hooks/useCours';
import useFormations from '../../hooks/useFormations';
import { useAuth } from '../../contexts/AuthContext';
import { Editor } from '@tinymce/tinymce-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';

interface CoursFormProps {
  cours?: Cours;
  formationId?: string;
  isEditing?: boolean;
}

type FormData = {
  titre: string;
  contenu: string;
  ordre: number;
  presentation?: FileList;
};

export default function CoursForm({ cours, formationId, isEditing = false }: CoursFormProps) {
  const { user } = useAuth();
  const { createCours, updateCours, error: coursError } = useCours();
  const { getFormationById } = useFormations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formationTitre, setFormationTitre] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const [presentationFile, setPresentationFile] = useState<File | null>(null);
  const [presentationUrl, setPresentationUrl] = useState<string | null>(cours?.presentationUrl || null);
  
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      titre: cours?.titre || '',
      contenu: cours?.contenu || '',
      ordre: cours?.ordre || 1,
    }
  });
  
  useEffect(() => {
    const fetchFormation = async () => {
      const id = formationId || cours?.formationId;
      if (id) {
        const formation = await getFormationById(id);
        if (formation) {
          setFormationTitre(formation.titre);
        }
      }
    };
    
    fetchFormation();
  }, [formationId, cours, getFormationById]);
  
  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);
      
      let finalPresentationUrl = cours?.presentationUrl || null;
      
      if (data.presentation && data.presentation.length > 0) {
        const file = data.presentation[0];
        const storageRef = ref(storage, `formations/${user?.uid}/${Date.now()}_${file.name}`);
        
        const snapshot = await uploadBytes(storageRef, file);
        
        finalPresentationUrl = await getDownloadURL(snapshot.ref);
      }
      
      if (isEditing && cours) {
        await updateCours(cours.id, {
          titre: data.titre,
          contenu: data.contenu,
          ordre: data.ordre,
          presentationUrl: finalPresentationUrl
        });
      } else {
        await createCours({
          formationId: formationId!,
          titre: data.titre,
          contenu: data.contenu,
          ordre: data.ordre,
          presentationUrl: finalPresentationUrl
        });
      }
      
      router.push(`/formations/${formationId}`);
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePresentationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      
      if (!file.name.endsWith('.ppt') && !file.name.endsWith('.pptx')) {
        setError("Le fichier sélectionné n'est pas une présentation PowerPoint valide (.ppt ou .pptx)");
        return;
      }
      
      setPresentationFile(file);
    }
  };
  
  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {(error || coursError) && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error || coursError}
        </div>
      )}
      
      {formationTitre && (
        <div className="p-3 bg-gray-100 border border-gray-300 text-gray-700 rounded">
          Formation : {formationTitre}
        </div>
      )}
      
      <div>
        <label htmlFor="titre" className="block text-sm font-medium leading-6 text-gray-900">
          Titre du cours
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
        <label htmlFor="contenu" className="block text-sm font-medium leading-6 text-gray-900">
          Contenu du cours
        </label>
        <div className="mt-2">
          <Controller
            name="contenu"
            control={control}
            rules={{ required: 'Le contenu est requis' }}
            render={({ field: { onChange, value } }) => (
              <Editor
              apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                onInit={(evt, editor) => editorRef.current = editor}
                initialValue={value}
                onEditorChange={onChange}
                init={{
                  height: 500,
                  menubar: true,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                  ],
                  toolbar: 'undo redo | blocks | ' +
                    'bold italic forecolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | help',
                  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                }}
              />
            )}
          />
          {errors.contenu && (
            <p className="mt-1 text-sm text-red-600">{errors.contenu.message}</p>
          )}
        </div>
      </div>
      
      <div>
        <label htmlFor="ordre" className="block text-sm font-medium leading-6 text-gray-900">
          Ordre du cours
        </label>
        <div className="mt-2">
          <input
            id="ordre"
            type="number"
            min="1"
            {...register('ordre', { 
              required: 'L\'ordre est requis',
              min: {
                value: 1,
                message: 'L\'ordre doit être supérieur à 0'
              }
            })}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
          {errors.ordre && (
            <p className="mt-1 text-sm text-red-600">{errors.ordre.message}</p>
          )}
        </div>
      </div>
      
      <div>
        <label htmlFor="presentation" className="block text-sm font-medium leading-6 text-gray-900">
          Présentation PowerPoint (optionnelle)
        </label>
        <div className="mt-2">
          <input
            id="presentation"
            type="file"
            accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            {...register('presentation')}
            onChange={handlePresentationChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
          />
        </div>
        
        {presentationUrl && (
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-900">Présentation actuelle :</p>
            <a 
              href={presentationUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Voir la présentation
            </a>
          </div>
        )}
      </div>
      
      <div>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-300"
        >
          {loading ? 'Chargement...' : isEditing ? 'Mettre à jour' : 'Créer le cours'}
        </button>
      </div>
    </form>
  );
}
