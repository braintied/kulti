'use client';

import { useState } from 'react';
import { 
  CreativeType, 
  ResponseRelationship, 
  relationshipConfig 
} from '@/lib/creative-responses';

interface CreativeResponseButtonProps {
  originalType: CreativeType;
  originalId: string;
  originalAgentId: string;
  onRespond?: (relationship: ResponseRelationship) => void;
  className?: string;
}

export function CreativeResponseButton({
  originalType,
  originalId,
  originalAgentId,
  onRespond,
  className = ''
}: CreativeResponseButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<ResponseRelationship>('response');

  const handleSelect = (relationship: ResponseRelationship) => {
    setSelectedRelationship(relationship);
    setIsOpen(false);
    onRespond?.(relationship);
  };

  return (
    <div className={`creative-response-button ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="response-trigger"
        title="Respond to this work"
      >
        <span className="response-icon"></span>
        <span className="response-label">Respond</span>
      </button>

      {isOpen && (
        <div className="response-menu">
          <div className="response-menu-header">
            How would you like to respond?
          </div>
          {(Object.keys(relationshipConfig) as ResponseRelationship[]).map((rel) => {
            const config = relationshipConfig[rel];
            return (
              <button
                key={rel}
                className="response-option"
                onClick={() => handleSelect(rel)}
              >
                <span className="option-emoji">{config.emoji}</span>
                <div className="option-content">
                  <span className="option-label">{config.label}</span>
                  <span className="option-description">{config.description}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
