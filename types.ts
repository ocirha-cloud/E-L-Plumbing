
// Fix: Import React to resolve the 'React' namespace
import React from 'react';

export interface ServiceCard {
  id: string;
  title: string;
  description: string;
  imagePrompt: string;
  imageUrl?: string;
  icon: React.ReactNode;
}

export interface AppState {
  images: Record<string, string>;
  isLoading: boolean;
  error?: string;
}
