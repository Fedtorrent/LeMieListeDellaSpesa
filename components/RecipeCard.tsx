import React from 'react';

interface RecipeCardProps {
  items: string[];
  onAddMissing: (ingredients: string[]) => void;
}

// In modalità No-AI, questo componente non renderizza nulla per pulire l'interfaccia
export const RecipeCard: React.FC<RecipeCardProps> = () => {
  return null;
};