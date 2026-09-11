import React from 'react';
import { CityModelOutput } from '../types.ts';
import { AgentChatbox } from './AgentChatbox.tsx';

interface AIAnalystModalProps {
  onClose: () => void;
  initialCity: CityModelOutput | null;
  allCities: CityModelOutput[];
}

export const AIAnalystModal: React.FC<AIAnalystModalProps> = ({
  onClose,
  initialCity,
  allCities,
}) => {
  const targetCity = initialCity || allCities[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl h-[85vh] max-h-[780px] rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <AgentChatbox
          currentCity={targetCity}
          allCities={allCities}
          onClose={onClose}
          isMobileEmbedded={false}
        />
      </div>
    </div>
  );
};
