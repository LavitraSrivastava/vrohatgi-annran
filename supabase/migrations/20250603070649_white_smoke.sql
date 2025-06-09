/*
  # Add Checklist Management Tables

  1. New Tables
    - `checklists`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `created_by` (uuid, foreign key to users.id)
      - `active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `checklist_items`
      - `id` (uuid, primary key)
      - `checklist_id` (uuid, foreign key to checklists.id)
      - `question` (text)
      - `category` (text)
      - `required` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create checklists table
CREATE TABLE IF NOT EXISTS checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES users(id),
  active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create checklist_items table
CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  question text NOT NULL,
  category text NOT NULL,
  required boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- Create policies for checklists table
CREATE POLICY "Users can read all checklists"
  ON checklists
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create checklists"
  ON checklists
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update checklists"
  ON checklists
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create policies for checklist_items table
CREATE POLICY "Users can read all checklist items"
  ON checklist_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create checklist items"
  ON checklist_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update checklist items"
  ON checklist_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );