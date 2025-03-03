import { useState } from 'react';
import { Question } from '../../types';

interface QuizQuestionProps {
  question: Question;
  index: number;
  onAnswer: (questionId: string, reponse: number) => void;
  selectedAnswer?: number;
  showCorrect?: boolean;
  disabled?: boolean;
}

export default function QuizQuestion({ 
  question, 
  index, 
  onAnswer, 
  selectedAnswer, 
  showCorrect = false,
  disabled = false
}: QuizQuestionProps) {
  const [selected, setSelected] = useState<number | undefined>(selectedAnswer);
  
  const handleSelect = (optionIndex: number) => {
    if (disabled) return;
    
    setSelected(optionIndex);
    onAnswer(question.id, optionIndex);
  };
  
  return (
    <div className="p-4 border border-gray-300 rounded-md">
      <h3 className="text-lg font-medium leading-6 text-gray-900">
        Question {index + 1}: {question.texte}
      </h3>
      
      <div className="mt-4 space-y-2">
        {question.options.map((option, optionIndex) => (
          <div 
            key={optionIndex} 
            className={`p-3 rounded-md cursor-pointer ${
              selected === optionIndex 
                ? showCorrect 
                  ? String(optionIndex) === String(question.reponseCorrecte) 
                    ? 'bg-green-100 border border-green-500' 
                    : 'bg-red-100 border border-red-500'
                  : 'bg-indigo-100 border border-indigo-500'
                : showCorrect && String(optionIndex) === String(question.reponseCorrecte)
                  ? 'bg-green-100 border border-green-500'
                  : 'bg-white border border-gray-300 hover:bg-gray-50'
            } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => handleSelect(optionIndex)}
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 h-5 w-5 rounded-full border ${
                selected === optionIndex ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
              } mr-2`}>
                {selected === optionIndex && (
                  <div className="h-3 w-3 m-1 rounded-full bg-white"></div>
                )}
              </div>
              <div className="ml-3 text-sm">
                <label className="font-medium text-gray-700">
                  {option}
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
