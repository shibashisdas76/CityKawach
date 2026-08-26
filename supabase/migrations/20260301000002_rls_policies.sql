-- Migration: 20260301000002_rls_policies.sql
-- Description: Implement Row-Level Security (RLS) policies for RBAC & Department Isolation.

-- 1. Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE gap_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Get Current User Role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
    SELECT role FROM user_profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: Get Current User Department ID
CREATE OR REPLACE FUNCTION current_user_department_id()
RETURNS UUID AS $$
    SELECT department_id FROM user_profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

--------------------------------------------------------------------------------
-- 2. POLICIES FOR DEPARTMENTS
--------------------------------------------------------------------------------
CREATE POLICY "Departments are viewable by authenticated users"
ON departments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Departments insertable/updatable by Super and State Admins"
ON departments FOR ALL
TO authenticated
USING (current_user_role() IN ('SUPER_ADMIN', 'STATE_ADMIN'));

--------------------------------------------------------------------------------
-- 3. POLICIES FOR USER PROFILES
--------------------------------------------------------------------------------
CREATE POLICY "Users can view their own profile and Admins can view all"
ON user_profiles FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR current_user_role() IN ('SUPER_ADMIN', 'STATE_ADMIN')
    OR (current_user_role() = 'DEPARTMENT_ADMIN' AND department_id = current_user_department_id())
);

CREATE POLICY "Admins can manage user profiles"
ON user_profiles FOR ALL
TO authenticated
USING (current_user_role() IN ('SUPER_ADMIN', 'STATE_ADMIN'));

--------------------------------------------------------------------------------
-- 4. POLICIES FOR CAMERAS (WITH DEPARTMENT ISOLATION)
--------------------------------------------------------------------------------
CREATE POLICY "Cameras visible based on role and department"
ON cameras FOR SELECT
TO authenticated
USING (
    current_user_role() IN ('SUPER_ADMIN', 'STATE_ADMIN')
    OR department_id = current_user_department_id()
);

CREATE POLICY "Cameras inserted/updated by Department Admins and higher"
ON cameras FOR INSERT
TO authenticated
WITH CHECK (
    current_user_role() IN ('SUPER_ADMIN', 'STATE_ADMIN')
    OR (current_user_role() IN ('DEPARTMENT_ADMIN', 'OPERATOR') AND department_id = current_user_department_id())
);

CREATE POLICY "Cameras updated by Department Admins and Operators in their department"
ON cameras FOR UPDATE
TO authenticated
USING (
    current_user_role() IN ('SUPER_ADMIN', 'STATE_ADMIN')
    OR (current_user_role() IN ('DEPARTMENT_ADMIN', 'OPERATOR') AND department_id = current_user_department_id())
);

CREATE POLICY "Cameras deleted only by Super and State Admins"
ON cameras FOR DELETE
TO authenticated
USING (current_user_role() IN ('SUPER_ADMIN', 'STATE_ADMIN'));

--------------------------------------------------------------------------------
-- 5. POLICIES FOR CAMERA HEALTH
--------------------------------------------------------------------------------
CREATE POLICY "Camera health visible to users with camera access"
ON camera_health FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM cameras c
        WHERE c.id = camera_health.camera_id
        AND (
            current_user_role() IN ('SUPER_ADMIN', 'STATE_ADMIN')
            OR c.department_id = current_user_department_id()
        )
    )
);

CREATE POLICY "Camera health records inserted by automated system or operators"
ON camera_health FOR INSERT
TO authenticated
WITH CHECK (true);

--------------------------------------------------------------------------------
-- 6. POLICIES FOR COVERAGE ZONES & GAP ANALYSIS
--------------------------------------------------------------------------------
CREATE POLICY "Coverage zones visible to all authenticated users"
ON coverage_zones FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Coverage zones manageable by State and Super Admins"
ON coverage_zones FOR ALL
TO authenticated
USING (current_user_role() IN ('SUPER_ADMIN', 'STATE_ADMIN'));

CREATE POLICY "Gap analysis visible to all authenticated users"
ON gap_analysis FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gap analysis manageable by State and Super Admins"
ON gap_analysis FOR ALL
TO authenticated
USING (current_user_role() IN ('SUPER_ADMIN', 'STATE_ADMIN'));

--------------------------------------------------------------------------------
-- 7. POLICIES FOR AUDIT LOGS (APPEND-ONLY LEDGER)
--------------------------------------------------------------------------------
CREATE POLICY "Audit logs visible to Admins"
ON audit_logs FOR SELECT
TO authenticated
USING (current_user_role() IN ('SUPER_ADMIN', 'STATE_ADMIN', 'DEPARTMENT_ADMIN'));

CREATE POLICY "Audit logs insertable by any authenticated action"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- CRITICAL RESTRICTION: No UPDATE or DELETE policies created for audit_logs.
-- This enforces append-only immutability at the database security level.
