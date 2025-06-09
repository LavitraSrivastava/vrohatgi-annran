/*
  # Initial Schema Setup

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `full_name` (text)
      - `role` (enum: admin, auditor, reviewer)
      - `created_at` (timestamp)
    
    - `audits`
      - `id` (uuid, primary key)
      - `title` (text)
      - `created_by` (uuid, foreign key to users.id)
      - `site` (text)
      - `type` (text)
      - `status` (enum: draft, submitted, reviewed, approved)
      - `score` (numeric, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `audit_items`
      - `id` (uuid, primary key)
      - `audit_id` (uuid, foreign key to audits.id)
      - `question` (text)
      - `category` (text)
      - `response` (enum: yes, no, n/a)
      - `notes` (text, nullable)
      - `evidence_urls` (text array, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `audit_templates`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `created_by` (uuid, foreign key to users.id)
      - `categories` (text array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `template_items`
      - `id` (uuid, primary key)
      - `template_id` (uuid, foreign key to audit_templates.id)
      - `question` (text)
      - `category` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'auditor', 'reviewer');
CREATE TYPE audit_status AS ENUM ('draft', 'submitted', 'reviewed', 'approved');
CREATE TYPE audit_response AS ENUM ('yes', 'no', 'n/a');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'auditor',
  created_at timestamptz DEFAULT now()
);

-- Create audits table
CREATE TABLE IF NOT EXISTS audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  site text NOT NULL,
  type text NOT NULL,
  status audit_status NOT NULL DEFAULT 'draft',
  score numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audit_items table
CREATE TABLE IF NOT EXISTS audit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  question text NOT NULL,
  category text NOT NULL,
  response audit_response,
  notes text,
  evidence_urls text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audit_templates table
CREATE TABLE IF NOT EXISTS audit_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  categories text[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create template_items table
CREATE TABLE IF NOT EXISTS template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES audit_templates(id) ON DELETE CASCADE,
  question text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_items ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for audits table
CREATE POLICY "Users can read all audits"
  ON audits
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create audits"
  ON audits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own audits"
  ON audits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create policies for audit_items table
CREATE POLICY "Users can read all audit items"
  ON audit_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create audit items"
  ON audit_items
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM audits
    WHERE audits.id = audit_id
    AND audits.created_by = auth.uid()
  ));

CREATE POLICY "Users can update their audit items"
  ON audit_items
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM audits
    WHERE audits.id = audit_id
    AND audits.created_by = auth.uid()
  ));

-- Create policies for audit_templates table
CREATE POLICY "Users can read all templates"
  ON audit_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create templates"
  ON audit_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their templates"
  ON audit_templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create policies for template_items table
CREATE POLICY "Users can read all template items"
  ON template_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create template items"
  ON template_items
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM audit_templates
    WHERE audit_templates.id = template_id
    AND audit_templates.created_by = auth.uid()
  ));

CREATE POLICY "Users can update their template items"
  ON template_items
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM audit_templates
    WHERE audit_templates.id = template_id
    AND audit_templates.created_by = auth.uid()
  ));