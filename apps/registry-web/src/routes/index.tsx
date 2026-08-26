import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { CameraListPage } from '../pages/cameras/CameraListPage';
import { CameraCreatePage } from '../pages/cameras/CameraCreatePage';
import { CameraBulkImportPage } from '../pages/cameras/CameraBulkImportPage';
import { CameraDetailPage } from '../pages/cameras/CameraDetailPage';
import { GisMapPage } from '../pages/gis/GisMapPage';
import { GapAnalysisPage } from '../pages/gis/GapAnalysisPage';
import { AuditLogsPage } from '../pages/audit/AuditLogsPage';
import { HealthTelemetryPage } from '../pages/health/HealthTelemetryPage';
import { DepartmentsPage } from '../pages/departments/DepartmentsPage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { LoginPage } from '../pages/auth/LoginPage'; // <-- Added Login Import

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Unauthenticated Route (Outside the layout) */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Command Center Routes */}
      <Route path="/" element={<AppLayout />}>
        {/* Redirect the root URL directly to the login page */}
        <Route index element={<Navigate to="/login" replace />} />

        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="cameras" element={<CameraListPage />} />
        <Route path="cameras/new" element={<CameraCreatePage />} />
        <Route path="cameras/import" element={<CameraBulkImportPage />} />
        <Route path="cameras/:id" element={<CameraDetailPage />} />
        <Route path="map" element={<GisMapPage />} />
        <Route path="health" element={<HealthTelemetryPage />} />
        <Route path="gap-analysis" element={<GapAnalysisPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};