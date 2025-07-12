import React from 'react';
import { X } from 'lucide-react';

interface SkillChipProps {
  skill: {
    id: string;
    name: string;
  };
  type?: 'offered' | 'wanted' | 'default';
  onRemove?: (skillId: string) => void;
  className?: string;
}

export const SkillChip: React.FC<SkillChipProps> = ({ 
  skill, 
  type = 'default', 
  onRemove, 
  className = '' 
}) => {
  const getChipStyle = () => {
    switch (type) {
      case 'offered':
        return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'wanted':
        return 'bg-success-100 text-success-800 border-success-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getChipStyle()} ${className}`}>
      <span>{skill.name}</span>
      {onRemove && (
        <button
          onClick={() => onRemove(skill.id)}
          className="ml-2 text-gray-500 hover:text-gray-700"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}; 