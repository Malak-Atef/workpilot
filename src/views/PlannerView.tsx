import React, { useEffect } from 'react';
import { PlannerWeekView } from '../components/Planner/PlannerWeekView';
import { useStore } from '../store/useStore';

export const PlannerView: React.FC = () => {
  const { fetchPlannedItems } = useStore();

  useEffect(() => {
    fetchPlannedItems();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto overflow-y-auto max-h-[calc(100vh-4rem)]">
      <PlannerWeekView />
    </div>
  );
};
