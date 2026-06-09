import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/store';

export function useRealtime() {
  const { updateCurrentTime, personnel, updatePersonnel } = useAppStore();

  const simulatePersonnelMovement = useCallback(() => {
    personnel.forEach((p) => {
      if (p.status === 'patrol' || p.status === 'on-duty') {
        const dx = (Math.random() - 0.5) * 10;
        const dy = (Math.random() - 0.5) * 10;
        const newX = Math.max(50, Math.min(850, p.x + dx));
        const newY = Math.max(50, Math.min(600, p.y + dy));
        updatePersonnel(p.id, { x: newX, y: newY });
      }
    });
  }, [personnel, updatePersonnel]);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      updateCurrentTime();
    }, 1000);

    const movementInterval = setInterval(() => {
      simulatePersonnelMovement();
    }, 5000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(movementInterval);
    };
  }, [updateCurrentTime, simulatePersonnelMovement]);
}
