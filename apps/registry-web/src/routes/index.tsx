import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
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

// ── Model 4: Consolidated Central VMS Platform ──────────────────────────────
import { VmsLandingPage } from '../pages/vms/VmsLandingPage';
import { LiveVideoWallPage } from '../pages/vms/LiveVideoWallPage';
import { TimelinePlaybackPage } from '../pages/vms/TimelinePlaybackPage';
import { AiAnalyticsSuitePage } from '../pages/vms/AiAnalyticsSuitePage';
import { AnprEnginePage } from '../pages/vms/AnprEnginePage';
import { VehicleTrackingPage } from '../pages/vms/VehicleTrackingPage';
import { AlertsHubPage } from '../pages/vms/AlertsHubPage';
import { IntegrationHubPage } from '../pages/vms/IntegrationHubPage';
import { StorageTierPage } from '../pages/vms/StorageTierPage';
import { ScalabilityLoadLabPage } from '../pages/vms/ScalabilityLoadLabPage';
import { DisasterRecoveryPage } from '../pages/vms/DisasterRecoveryPage';
import { SecurityArchitecturePage } from '../pages/vms/SecurityArchitecturePage';

// ── Model 3: VMS Middleware & Multi-Vendor Federation Layer ──────────────────
import { FederationOverviewPage } from '../pages/federation/FederationOverviewPage';
import { CrossVmsVideoWallPage } from '../pages/federation/CrossVmsVideoWallPage';
import { EventCorrelationPage } from '../pages/federation/EventCorrelationPage';
import { UnifiedIncidentHubPage } from '../pages/federation/UnifiedIncidentHubPage';
import { ConnectorFrameworkPage } from '../pages/federation/ConnectorFrameworkPage';
import { FederatedReportPage } from '../pages/federation/FederatedReportPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Unauthenticated Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Command Center Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Redirect root URL to Central VMS Dashboard */}
        <Route index element={<Navigate to="/vms" replace />} />

        {/* ── Model 4: Consolidated Central VMS Platform ── */}
        <Route path="vms" element={<VmsLandingPage />} />
        <Route path="vms/live" element={<LiveVideoWallPage />} />
        <Route path="vms/playback" element={<TimelinePlaybackPage />} />
        <Route path="vms/ai-suite" element={<AiAnalyticsSuitePage />} />
        <Route path="vms/anpr" element={<AnprEnginePage />} />
        <Route path="vms/tracking" element={<VehicleTrackingPage />} />
        <Route path="vms/alerts" element={<AlertsHubPage />} />
        <Route path="vms/analytics" element={<AiAnalyticsSuitePage />} />
        <Route path="vms/integrations" element={<IntegrationHubPage />} />
        <Route path="vms/storage" element={<StorageTierPage />} />
        <Route path="vms/scalability" element={<ScalabilityLoadLabPage />} />
        <Route path="vms/dr" element={<DisasterRecoveryPage />} />
        <Route path="vms/security" element={<SecurityArchitecturePage />} />

        {/* ── Model 3: VMS Middleware & Multi-Vendor Federation Layer ── */}
        <Route path="federation" element={<FederationOverviewPage />} />
        <Route path="federation/wall" element={<CrossVmsVideoWallPage />} />
        <Route path="federation/correlation" element={<EventCorrelationPage />} />
        <Route path="federation/incidents" element={<UnifiedIncidentHubPage />} />
        <Route path="federation/connectors" element={<ConnectorFrameworkPage />} />
        <Route path="federation/reports" element={<FederatedReportPage />} />

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

        {/* Aliases for direct navigation */}
        <Route path="viewer" element={<LiveVideoWallPage />} />
        <Route path="viewer/search" element={<VehicleTrackingPage />} />
        <Route path="viewer/detections" element={<AnprEnginePage />} />
        <Route path="viewer/alerts" element={<AlertsHubPage />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/vms" replace />} />
      </Route>
    </Routes>
  );
};