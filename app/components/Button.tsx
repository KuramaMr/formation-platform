import Link from 'next/link';
import { ReactNode } from 'react';

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'primary';
  className?: string;
};

export default function Button({ 
  children, 
  href, 
  onClick, 
  variant = 'default',
  className = ''
}: ButtonProps) {
  const baseClasses = "px-4 py-3 font-medium rounded-lg shadow-md border border-gray-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-inner";
  
  const variantClasses = {
    default: "bg-white text-indigo-600 border-gray-200 border-b-2 border-b-gray-300 hover:shadow-lg",
    primary: "bg-indigo-600 text-white border-indigo-700 border-b-2 border-b-indigo-800 hover:shadow-lg"
  };
  
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;
  
  if (href) {
    return (
      <Link href={href} className={buttonClasses}>
        {children}
      </Link>
    );
  }
  
  return (
    <button onClick={onClick} className={buttonClasses}>
      {children}
    </button>
  );
}
