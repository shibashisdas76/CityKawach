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

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="cameras" element={<CameraListPage />} />
        <Route path="cameras/new" element={<CameraCreatePage />} />
        <Route path="cameras/import" element={<CameraBulkImportPage />} />
        <Route path="cameras/:id" element={<CameraDetailPage />} />
        <Route path="map" element={<GisMapPage />} />
        <Route path="health" element={<CameraDetailPage />} />
        <Route path="gap-analysis" element={<GapAnalysisPage />} />
        <Route path="departments" element={<CameraListPage />} />
        <Route path="reports" element={<AuditLogsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};