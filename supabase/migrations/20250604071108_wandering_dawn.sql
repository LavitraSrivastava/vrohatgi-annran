/*
  # Create Checklist Audit Tables

  1. New Tables
    - `checklist_templates` - Stores uploaded checklist templates
    - `checklist_audits` - Stores audit instances based on templates
    - `checklist_audit_items` - Stores individual audit responses
    - `audit_evidence` - Stores evidence files for "No" responses

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
*/

-- Create enum for audit item remarks
CREATE TYPE audit_remark AS ENUM ('yes', 'no', 'not_applicable', 'unavailable');

-- Create checklist templates table
CREATE TABLE IF NOT EXISTS checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  structure jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

-- Create checklist audits table
CREATE TABLE IF NOT EXISTS checklist_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES checklist_templates(id),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  auditor_id uuid REFERENCES auth.users(id),
  reviewer_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  reviewed_at timestamptz
);

ALTER TABLE checklist_audits ENABLE ROW LEVEL SECURITY;

-- Create checklist audit items table
CREATE TABLE IF NOT EXISTS checklist_audit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid REFERENCES checklist_audits(id) ON DELETE CASCADE,
  row_index integer NOT NULL,
  audit_details text,
  observation text,
  remark audit_remark,
  last_modified_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE checklist_audit_items ENABLE ROW LEVEL SECURITY;

-- Create audit evidence table
CREATE TABLE IF NOT EXISTS audit_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_item_id uuid REFERENCES checklist_audit_items(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_evidence ENABLE ROW LEVEL SECURITY;

-- Create audit history table for tracking changes
CREATE TABLE IF NOT EXISTS audit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_item_id uuid REFERENCES checklist_audit_items(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  modified_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Checklist Templates
CREATE POLICY "Reviewers can create templates"
  ON checklist_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'reviewer'
    )
  );

CREATE POLICY "All authenticated users can view templates"
  ON checklist_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Checklist Audits
CREATE POLICY "Auditors can create audits"
  ON checklist_audits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'auditor'
    )
  );

CREATE POLICY "Users can view their assigned audits"
  ON checklist_audits
  FOR SELECT
  TO authenticated
  USING (
    auditor_id = auth.uid() OR
    reviewer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'reviewer'
    )
  );

CREATE POLICY "Auditors can update their audits"
  ON checklist_audits
  FOR UPDATE
  TO authenticated
  USING (auditor_id = auth.uid())
  WITH CHECK (auditor_id = auth.uid());

-- Checklist Audit Items
CREATE POLICY "Users can view audit items they have access to"
  ON checklist_audit_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM checklist_audits
      WHERE checklist_audits.id = audit_id
      AND (
        checklist_audits.auditor_id = auth.uid() OR
        checklist_audits.reviewer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid()
          AND raw_user_meta_data->>'role' = 'reviewer'
        )
      )
    )
  );

CREATE POLICY "Auditors can update their audit items"
  ON checklist_audit_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM checklist_audits
      WHERE checklist_audits.id = audit_id
      AND checklist_audits.auditor_id = auth.uid()
      AND checklist_audits.status = 'in_progress'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM checklist_audits
      WHERE checklist_audits.id = audit_id
      AND checklist_audits.auditor_id = auth.uid()
      AND checklist_audits.status = 'in_progress'
    )
  );

-- Audit Evidence
CREATE POLICY "Users can view evidence they have access to"
  ON audit_evidence
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM checklist_audit_items
      JOIN checklist_audits ON checklist_audit_items.audit_id = checklist_audits.id
      WHERE checklist_audit_items.id = audit_item_id
      AND (
        checklist_audits.auditor_id = auth.uid() OR
        checklist_audits.reviewer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid()
          AND raw_user_meta_data->>'role' = 'reviewer'
        )
      )
    )
  );

CREATE POLICY "Auditors can upload evidence"
  ON audit_evidence
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM checklist_audit_items
      JOIN checklist_audits ON checklist_audit_items.audit_id = checklist_audits.id
      WHERE checklist_audit_items.id = audit_item_id
      AND checklist_audits.auditor_id = auth.uid()
      AND checklist_audits.status = 'in_progress'
    )
  );

-- Audit History
CREATE POLICY "Users can view audit history they have access to"
  ON audit_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM checklist_audit_items
      JOIN checklist_audits ON checklist_audit_items.audit_id = checklist_audits.id
      WHERE checklist_audit_items.id = audit_item_id
      AND (
        checklist_audits.auditor_id = auth.uid() OR
        checklist_audits.reviewer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid()
          AND raw_user_meta_data->>'role' = 'reviewer'
        )
      )
    )
  );