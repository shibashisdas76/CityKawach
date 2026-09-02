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
import { LoginPage } from '../pages/auth/LoginPage';
// ── Model 2 & Model 4: Unified Viewer & AI System ──────────────────────────
import { VmsLandingPage } from '../pages/vms/VmsLandingPage';
import { LiveVideoWallPage } from '../pages/vms/LiveVideoWallPage';
import { AnprEnginePage } from '../pages/vms/AnprEnginePage';
import { VehicleTrackingPage } from '../pages/vms/VehicleTrackingPage';
import { AlertsHubPage } from '../pages/vms/AlertsHubPage';
import { AnalyticsEnginePage } from '../pages/vms/AnalyticsEnginePage';
import { IntegrationHubPage } from '../pages/vms/IntegrationHubPage';
import { StorageTierPage } from '../pages/vms/StorageTierPage';
import { SecurityArchitecturePage } from '../pages/vms/SecurityArchitecturePage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Unauthenticated Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Command Center Routes */}
      <Route path="/" element={<AppLayout />}>
        {/* Redirect root URL to dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* ── Model 1: Central Registry & GIS ── */}
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

        {/* ── Model 2: Unified Viewer & Edge AI Analytics ── */}
        <Route path="vms" element={<VmsLandingPage />} />
        <Route path="vms/live" element={<LiveVideoWallPage />} />
        <Route path="vms/anpr" element={<AnprEnginePage />} />
        <Route path="vms/tracking" element={<VehicleTrackingPage />} />
        <Route path="vms/alerts" element={<AlertsHubPage />} />
        <Route path="vms/analytics" element={<AnalyticsEnginePage />} />
        <Route path="vms/integrations" element={<IntegrationHubPage />} />
        <Route path="vms/storage" element={<StorageTierPage />} />
        <Route path="vms/security" element={<SecurityArchitecturePage />} />

        {/* Model 2 Direct Aliases */}
        <Route path="viewer" element={<LiveVideoWallPage />} />
        <Route path="viewer/search" element={<VehicleTrackingPage />} />
        <Route path="viewer/detections" element={<AnprEnginePage />} />
        <Route path="viewer/alerts" element={<AlertsHubPage />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};