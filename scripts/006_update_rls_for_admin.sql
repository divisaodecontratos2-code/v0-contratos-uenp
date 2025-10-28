-- Update RLS policies to only allow dir.adm@uenp.edu.br as admin

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to insert contracts" ON contracts;
DROP POLICY IF EXISTS "Allow authenticated users to update contracts" ON contracts;
DROP POLICY IF EXISTS "Allow authenticated users to delete contracts" ON contracts;

-- Fixed table names to match actual schema
DROP POLICY IF EXISTS "Allow authenticated users to insert files" ON contract_files;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON contract_files;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON contract_files;

DROP POLICY IF EXISTS "Allow authenticated users to insert amendments" ON contract_amendments;
DROP POLICY IF EXISTS "Allow authenticated users to update amendments" ON contract_amendments;
DROP POLICY IF EXISTS "Allow authenticated users to delete amendments" ON contract_amendments;

DROP POLICY IF EXISTS "Allow authenticated users to insert extensions" ON contract_extensions;
DROP POLICY IF EXISTS "Allow authenticated users to update extensions" ON contract_extensions;
DROP POLICY IF EXISTS "Allow authenticated users to delete extensions" ON contract_extensions;

DROP POLICY IF EXISTS "Allow authenticated users to insert audit logs" ON audit_logs;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT email = 'dir.adm@uenp.edu.br'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Contracts policies - only admin can modify
CREATE POLICY "Only admin can insert contracts"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admin can update contracts"
  ON contracts FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Only admin can delete contracts"
  ON contracts FOR DELETE
  TO authenticated
  USING (is_admin());

-- Fixed table name from "files" to "contract_files"
-- Files policies - only admin can modify
CREATE POLICY "Only admin can insert files"
  ON contract_files FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admin can update files"
  ON contract_files FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Only admin can delete files"
  ON contract_files FOR DELETE
  TO authenticated
  USING (is_admin());

-- Fixed table name from "amendments" to "contract_amendments"
-- Amendments policies - only admin can modify
CREATE POLICY "Only admin can insert amendments"
  ON contract_amendments FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admin can update amendments"
  ON contract_amendments FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Only admin can delete amendments"
  ON contract_amendments FOR DELETE
  TO authenticated
  USING (is_admin());

-- Fixed table name from "extensions" to "contract_extensions"
-- Extensions policies - only admin can modify
CREATE POLICY "Only admin can insert extensions"
  ON contract_extensions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admin can update extensions"
  ON contract_extensions FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Only admin can delete extensions"
  ON contract_extensions FOR DELETE
  TO authenticated
  USING (is_admin());

-- Audit logs policies - only admin can insert
CREATE POLICY "Only admin can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());
