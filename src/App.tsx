import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SideNavBar } from './components/Navigation/SideNavBar';
import { TopHeader } from './components/Navigation/TopHeader';

import { DashboardView } from './views/DashboardView';
import { PlannerView } from './views/PlannerView';
import { WorkLogView } from './views/WorkLogView';
import { WeeklyReportView } from './views/WeeklyReportView';
import { WeeklyWorkPlanView } from './views/WeeklyWorkPlanView';
import { SettingsView } from './views/SettingsView';

const queryClient = new QueryClient();

const HeaderWrapper: React.FC = () => {
  const location = useLocation();

  const getHeaderInfo = () => {
    switch (location.pathname) {
      case '/':
        return { title: 'Dashboard', subtitle: 'Quick Capture & Daily Operational Command' };
      case '/planner':
        return { title: 'Planner', subtitle: 'Weekly Work Scheduler & Item Overview' };
      case '/weekly-plan':
        return { title: 'Weekly Work Plan', subtitle: 'Sunday–Thursday Forward Work Schedule Grid' };
      case '/work-log':
        return { title: 'Work Log', subtitle: 'Historical IT Operations Records' };
      case '/weekly-report':
        return { title: 'Weekly Report', subtitle: 'Sprint 2 Management Reporting Preview' };
      case '/settings':
        return { title: 'Settings', subtitle: 'System Architecture & Database Configuration' };
      default:
        return { title: 'WorkPilot', subtitle: 'IT Engineering Ops' };
    }
  };

  const { title, subtitle } = getHeaderInfo();
  return <TopHeader title={title} subtitle={subtitle} />;
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex h-screen w-screen bg-[#12131a] text-[#e3e1ec] overflow-hidden">
          <SideNavBar />
          <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            <HeaderWrapper />
            <div className="flex-1 overflow-y-auto bg-[#12131a]">
              <Routes>
                <Route path="/" element={<DashboardView />} />
                <Route path="/planner" element={<PlannerView />} />
                <Route path="/weekly-plan" element={<WeeklyWorkPlanView />} />
                <Route path="/work-log" element={<WorkLogView />} />
                <Route path="/weekly-report" element={<WeeklyReportView />} />
                <Route path="/settings" element={<SettingsView />} />
              </Routes>
            </div>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
