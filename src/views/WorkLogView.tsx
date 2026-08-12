import React, { useEffect } from 'react';
import { WorkLogTable } from '../components/WorkLog/WorkLogTable';
import { useStore } from '../store/useStore';

export const WorkLogView: React.FC = () => {
  const { fetchWorkLogs } = useStore();

  useEffect(() => {
    fetchWorkLogs();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto overflow-y-auto max-h-[calc(100vh-4rem)]">
      <WorkLogTable />
    </div>
  );
};
