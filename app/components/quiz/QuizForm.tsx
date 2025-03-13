'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { Quiz, Question } from '../../types';
import useQuiz from '../../hooks/useQuiz';
import useCours from '../../hooks/useCours';
import { useAuth } from '../../contexts/AuthContext';

interface QuizFormProps {
  quiz?: Quiz;
  coursId?: string;
  isEditing?: boolean;
}

type FormData = {
  titre: string;
  description: string;
  questions: {
    texte: string;
    options: string[];
    reponseCorrecte: number;
  }[];
};

export default function QuizForm({ quiz, coursId, isEditing = false }: QuizFormProps) {
  const { user } = useAuth();
  const { createQuiz, updateQuiz, error: quizError } = useQuiz();
  const { getCoursById } = useCours();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coursTitre, setCoursTitre] = useState<string | null>(null);
  
  const defaultQuestions = quiz?.questions || [
    { texte: '', options: ['', '', '', ''], reponseCorrecte: 0 }
  ];
  
  const { register, control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      titre: quiz?.titre || '',
      description: quiz?.description || '',
      questions: defaultQuestions.map(q => ({
        texte: q.texte,
        options: q.options,
        reponseCorrecte: q.reponseCorrecte
      }))
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions"
  });
  
  useState(() => {
    const fetchCours = async () => {
      const id = coursId || quiz?.coursId;
      if (id) {
        const cours = await getCoursById(id);
        if (cours) {
          setCoursTitre(cours.titre);
        }
      }
    };
    
    fetchCours();
  });
  
  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Générer des IDs pour les questions
      const questionsWithIds = data.questions.map(q => ({
        id: Math.random().toString(36).substring(2, 15),
        texte: q.texte,
        options: q.options,
        reponseCorrecte: q.reponseCorrecte
      }));
      
      if (isEditing && quiz) {
        // Mettre à jour le quiz
        await updateQuiz(quiz.id, {
          titre: data.titre,
          description: data.description,
          questions: questionsWithIds
        });
        
        // Rediriger vers la page du quiz
        router.push(`/quiz/${quiz.id}`);
      } else if (coursId) {
        // Créer un nouveau quiz
        const nouveauQuiz = await createQuiz({
          coursId,
          titre: data.titre,
          description: data.description,
          questions: questionsWithIds
        });
        
        if (nouveauQuiz) {
          // Rediriger vers la page du cours
          router.push(`/cours/${coursId}`);
        }
      }
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };
  
  const addQuestion = () => {
    append({ texte: '', options: ['', '', '', ''], reponseCorrecte: 0 });
  };
  
  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {(error || quizError) && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error || quizError}
        </div>
      )}
      
      {coursTitre && (
        <div className="p-3 bg-gray-100 border border-gray-300 text-gray-700 rounded">
          Cours : {coursTitre}
        </div>
      )}
      
      <div>
        <label htmlFor="titre" className="block text-sm font-medium leading-6 text-gray-900">
          Titre du quiz
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
            rows={3}
            {...register('description', { required: 'La description est requise' })}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Questions</h3>
        
        <div className="mt-4 space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border border-gray-300 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900">Question {index + 1}</h4>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-800 rounded-md border border-red-700 bg-white px-2 py-1 shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)]"
                  >
                    Supprimer
                  </button>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor={`questions.${index}.texte`} className="block text-sm font-medium leading-6 text-gray-900">
                  Texte de la question
                </label>
                <div className="mt-2">
                  <input
                    id={`questions.${index}.texte`}
                    type="text"
                    {...register(`questions.${index}.texte` as const, { required: 'Le texte de la question est requis' })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                  {errors.questions?.[index]?.texte && (
                    <p className="mt-1 text-sm text-red-600">{errors.questions[index]?.texte?.message}</p>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Options
                </label>
                <div className="mt-2 space-y-2">
                  {[0, 1, 2, 3].map((optionIndex) => (
                    <div key={optionIndex} className="flex items-center">
                      <input
                        id={`questions.${index}.options.${optionIndex}`}
                        type="text"
                        {...register(`questions.${index}.options.${optionIndex}` as const, { required: 'L\'option est requise' })}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                      <input
                        type="radio"
                        {...register(`questions.${index}.reponseCorrecte` as const)}
                        value={optionIndex}
                        className="ml-2 h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Sélectionnez la réponse correcte en cochant le bouton radio à côté de l&apos;option.
                </p>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center px-4 py-2 rounded-md border border-indigo-700 bg-white text-indigo-700 shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)]"
          >
            Ajouter une question
          </button>
        </div>
      </div>
      
      <div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-md border border-indigo-700 bg-indigo-600 px-4 py-2 text-white shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0.25rem_0.5rem_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0.25rem_0.25rem_0px_0px_rgba(0,0,0,0.1)]"
        >
          {loading
            ? "Chargement..."
            : isEditing
            ? "Mettre à jour"
            : "Créer le quiz"}
        </button>
      </div>
    </form>
  );
}
