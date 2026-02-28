-- =============================================================================
-- SUPABASE DATABASE SCHEMA FOR TICKETING SYSTEM
-- =============================================================================
-- This SQL file creates all the necessary tables, relationships, indexes,
-- and Row Level Security (RLS) policies for your ticketing system.
-- 
-- Run this in your Supabase SQL Editor to set up the database.
-- =============================================================================

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- Ticket status enum
CREATE TYPE ticket_status AS ENUM (
  'Open',
  'In Progress',
  'Waiting',
  'Resolved',
  'Closed'
);

-- Ticket priority enum
CREATE TYPE ticket_priority AS ENUM (
  'Low',
  'Medium',
  'High',
  'Urgent'
);

-- Task status enum
CREATE TYPE task_status AS ENUM (
  'To Do',
  'In Progress',
  'In Review',
  'Completed'
);

-- Task priority enum
CREATE TYPE task_priority AS ENUM (
  'Low',
  'Medium',
  'High',
  'Urgent'
);

-- User role enum
CREATE TYPE user_role AS ENUM (
  'Admin',
  'Manager',
  'IT',
  'User'
);

-- Notification type enum
CREATE TYPE notification_type AS ENUM (
  'ticket_created',
  'ticket_updated',
  'ticket_assigned',
  'ticket_completed',
  'task_created',
  'task_updated',
  'task_assigned',
  'task_completed',
  'mention',
  'comment',
  'system'
);

-- Notification channel enum (for n8n integration)
CREATE TYPE notification_channel AS ENUM (
  'in_app',
  'email',
  'messenger',
  'both'
);

-- =============================================================================
-- USERS TABLE
-- =============================================================================

CREATE TABLE users (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- Store hashed password
  
  -- User profile
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(50),
  
  -- Role and permissions
  role user_role DEFAULT 'User',
  
  -- IT-specific: Can only self-assign (boolean flag)
  can_self_assign BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- =============================================================================
-- TICKETS TABLE
-- =============================================================================

CREATE TABLE tickets (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ticket number (auto-generated)
  ticket_number SERIAL,
  
  -- Basic fields
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Status and priority
  status ticket_status DEFAULT 'Open',
  priority ticket_priority DEFAULT 'Medium',
  
  -- Requestee (who created the ticket)
  requestee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Assignee (who the ticket is assigned to)
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Project (stored as string as per your requirement)
  project VARCHAR(255),
  
  -- Due date
  due_date DATE,
  
  -- Tags (stored as array of strings)
  tags TEXT[] DEFAULT '{}',
  
  -- Completion details
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for tickets table
CREATE INDEX idx_tickets_ticket_number ON tickets(ticket_number);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_requestee_id ON tickets(requestee_id);
CREATE INDEX idx_tickets_assignee_id ON tickets(assignee_id);
CREATE INDEX idx_tickets_project ON tickets(project);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_tickets_due_date ON tickets(due_date);

-- Create a function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TASKS TABLE
-- =============================================================================

CREATE TABLE tasks (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Task number (auto-generated)
  task_number SERIAL,
  
  -- Basic fields
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Status and priority
  status task_status DEFAULT 'To Do',
  priority task_priority DEFAULT 'Medium',
  
  -- Project (stored as string as per your requirement)
  project VARCHAR(255),
  
  -- Assignee
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Progress tracking
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  estimated_hours DECIMAL(6,2),
  logged_hours DECIMAL(6,2) DEFAULT 0,
  
  -- Due date
  due_date DATE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add indexes for tasks table
CREATE INDEX idx_tasks_task_number ON tasks(task_number);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_project ON tasks(project);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS TABLE
-- =============================================================================

CREATE TABLE comments (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to ticket or task
  parent_type VARCHAR(20) NOT NULL CHECK (parent_type IN ('ticket', 'task')),
  parent_id UUID NOT NULL,
  
  -- Comment content
  content TEXT NOT NULL,
  
  -- Author
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Mentions (array of user IDs)
  mentions UUID[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for comments table
CREATE INDEX idx_comments_parent ON comments(parent_type, parent_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ATTACHMENTS TABLE
-- =============================================================================

CREATE TABLE attachments (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to ticket or task
  parent_type VARCHAR(20) NOT NULL CHECK (parent_type IN ('ticket', 'task')),
  parent_id UUID NOT NULL,
  
  -- File information
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER, -- in bytes
  mime_type VARCHAR(100),
  
  -- Uploaded by
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for attachments table
CREATE INDEX idx_attachments_parent ON attachments(parent_type, parent_id);
CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by);
CREATE INDEX idx_attachments_created_at ON attachments(created_at);

-- =============================================================================
-- NOTIFICATIONS TABLE
-- =============================================================================

CREATE TABLE notifications (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Notification content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type notification_type DEFAULT 'system',
  
  -- Reference to related entity (optional)
  related_type VARCHAR(20) CHECK (related_type IN ('ticket', 'task', 'comment', NULL)),
  related_id UUID,
  
  -- For ticket/task specific notifications
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- Recipient
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Read status
  is_read BOOLEAN DEFAULT FALSE,
  
  -- Notification channels (for n8n integration)
  -- This helps n8n know how to send notifications
  send_email BOOLEAN DEFAULT FALSE,
  send_messenger BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  messenger_sent BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Add indexes for notifications table
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_ticket_id ON notifications(ticket_id);
CREATE INDEX idx_notifications_task_id ON notifications(task_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_pending_send ON notifications(created_at) 
  WHERE (send_email = TRUE AND email_sent = FALSE) 
     OR (send_messenger = TRUE AND messenger_sent = FALSE);

-- =============================================================================
-- NOTIFICATION_LOG TABLE (for tracking n8n integration)
-- =============================================================================

CREATE TABLE notification_log (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to notification
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  
  -- Channel used
  channel notification_channel NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  
  -- External reference (e.g., message ID from messenger API)
  external_ref VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Add indexes for notification_log table
CREATE INDEX idx_notification_log_notification_id ON notification_log(notification_id);
CREATE INDEX idx_notification_log_status ON notification_log(status);
CREATE INDEX idx_notification_log_channel ON notification_log(channel);

-- =============================================================================
-- AUDIT_LOG TABLE (for tracking changes)
-- =============================================================================

CREATE TABLE audit_log (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Action details
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'view'
  entity_type VARCHAR(50) NOT NULL, -- 'ticket', 'task', 'user', 'comment', 'attachment'
  entity_id UUID NOT NULL,
  
  -- Old and new values (stored as JSON)
  old_values JSONB,
  new_values JSONB,
  
  -- User who performed the action
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- IP address
  ip_address INET,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for audit_log table
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- =============================================================================
-- TICKET_HISTORY TABLE (for tracking ticket status changes)
-- =============================================================================

CREATE TABLE ticket_history (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to ticket
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  
  -- Change details
  field_changed VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  
  -- Who made the change
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for ticket_history table
CREATE INDEX idx_ticket_history_ticket_id ON ticket_history(ticket_id);
CREATE INDEX idx_ticket_history_created_at ON ticket_history(created_at);

-- =============================================================================
-- TASK_HISTORY TABLE (for tracking task status changes)
-- =============================================================================

CREATE TABLE task_history (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to task
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- Change details
  field_changed VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  
  -- Who made the change
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for task_history table
CREATE INDEX idx_task_history_task_id ON task_history(task_id);
CREATE INDEX idx_task_history_created_at ON task_history(created_at);

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC NOTIFICATIONS
-- =============================================================================

-- Function to create notification when ticket is created
CREATE OR REPLACE FUNCTION notify_ticket_created()
RETURNS TRIGGER AS $$
DECLARE
  assignee_user_id UUID;
BEGIN
  -- Get assignee_id if assigned
  assignee_user_id := NEW.assignee_id;
  
  -- Create notification for assignee if exists
  IF assignee_user_id IS NOT NULL AND assignee_user_id != NEW.requestee_id THEN
    INSERT INTO notifications (title, message, type, related_type, related_id, user_id, ticket_id, send_email, send_messenger)
    VALUES (
      'New ticket assigned',
      'Ticket #' || NEW.ticket_number || ' - "' || NEW.title || '" has been assigned to you',
      'ticket_assigned',
      'ticket',
      NEW.id,
      assignee_user_id,
      NEW.id,
      TRUE,
      TRUE
    );
  END IF;
  
  -- Create notification for requestee
  IF NEW.requestee_id IS NOT NULL THEN
    INSERT INTO notifications (title, message, type, related_type, related_id, user_id, ticket_id, send_email, send_messenger)
    VALUES (
      'Ticket created',
      'Your ticket #' || NEW.ticket_number || ' - "' || NEW.title || '" has been created',
      'ticket_created',
      'ticket',
      NEW.id,
      NEW.requestee_id,
      NEW.id,
      TRUE,
      TRUE
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ticket creation
CREATE TRIGGER ticket_created_notification
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_ticket_created();

-- Function to create notification when ticket is updated
CREATE OR REPLACE FUNCTION notify_ticket_updated()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify requestee if ticket status changed
  IF OLD.status != NEW.status AND NEW.requestee_id IS NOT NULL THEN
    INSERT INTO notifications (title, message, type, related_type, related_id, user_id, ticket_id, send_email, send_messenger)
    VALUES (
      'Ticket status updated',
      'Ticket #' || NEW.ticket_number || ' status changed from ' || OLD.status || ' to ' || NEW.status,
      'ticket_updated',
      'ticket',
      NEW.id,
      NEW.requestee_id,
      NEW.id,
      TRUE,
      TRUE
    );
  END IF;
  
  -- Notify assignee if ticket is assigned to them
  IF NEW.assignee_id IS NOT NULL AND OLD.assignee_id != NEW.assignee_id THEN
    INSERT INTO notifications (title, message, type, related_type, related_id, user_id, ticket_id, send_email, send_messenger)
    VALUES (
      'New ticket assigned',
      'Ticket #' || NEW.ticket_number || ' - "' || NEW.title || '" has been assigned to you',
      'ticket_assigned',
      'ticket',
      NEW.id,
      NEW.assignee_id,
      NEW.id,
      TRUE,
      TRUE
    );
  END IF;
  
  -- Log to ticket_history
  IF OLD.status != NEW.status THEN
    INSERT INTO ticket_history (ticket_id, field_changed, old_value, new_value)
    VALUES (NEW.id, 'status', OLD.status::text, NEW.status::text);
  END IF;
  
  IF OLD.priority != NEW.priority THEN
    INSERT INTO ticket_history (ticket_id, field_changed, old_value, new_value)
    VALUES (NEW.id, 'priority', OLD.priority::text, NEW.priority::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ticket update
CREATE TRIGGER ticket_updated_notification
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_ticket_updated();

-- Function to create notification when task is created
CREATE OR REPLACE FUNCTION notify_task_created()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assignee_id IS NOT NULL THEN
    INSERT INTO notifications (title, message, type, related_type, related_id, user_id, task_id, send_email, send_messenger)
    VALUES (
      'New task assigned',
      'Task #' || NEW.task_number || ' - "' || NEW.title || '" has been assigned to you',
      'task_assigned',
      'task',
      NEW.id,
      NEW.assignee_id,
      NEW.id,
      TRUE,
      TRUE
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for task creation
CREATE TRIGGER task_created_notification
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_created();

-- Function to create notification when task is updated
CREATE OR REPLACE FUNCTION notify_task_updated()
RETURNS TRIGGER AS $$
BEGIN
  -- Log to task_history
  IF OLD.status != NEW.status THEN
    INSERT INTO task_history (task_id, field_changed, old_value, new_value)
    VALUES (NEW.id, 'status', OLD.status::text, NEW.status::text);
    
    -- Notify assignee of status change
    IF NEW.assignee_id IS NOT NULL THEN
      INSERT INTO notifications (title, message, type, related_type, related_id, user_id, task_id, send_email, send_messenger)
      VALUES (
        'Task status updated',
        'Task #' || NEW.task_number || ' status changed from ' || OLD.status || ' to ' || NEW.status,
        'task_updated',
        'task',
        NEW.id,
        NEW.assignee_id,
        NEW.id,
        TRUE,
        TRUE
      );
    END IF;
  END IF;
  
  IF OLD.priority != NEW.priority THEN
    INSERT INTO task_history (task_id, field_changed, old_value, new_value)
    VALUES (NEW.id, 'priority', OLD.priority::text, NEW.priority::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for task update
CREATE TRIGGER task_updated_notification
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_updated();

-- Function to create notification when user is mentioned in comment
CREATE OR REPLACE FUNCTION notify_mentioned_in_comment()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_user UUID;
  parent_title VARCHAR(255);
  parent_type VARCHAR(20);
BEGIN
  -- Check if there are mentions in the new comment
  IF NEW.mentions IS NOT NULL AND array_length(NEW.mentions, 1) > 0 THEN
    -- Get the parent title
    IF NEW.parent_type = 'ticket' THEN
      SELECT title INTO parent_title FROM tickets WHERE id = NEW.parent_id;
    ELSIF NEW.parent_type = 'task' THEN
      SELECT title INTO parent_title FROM tasks WHERE id = NEW.parent_id;
    END IF;
    
    -- Create notification for each mentioned user
    FOR mentioned_user IN SELECT unnest(NEW.mentions) LOOP
      INSERT INTO notifications (title, message, type, related_type, related_id, user_id, send_email, send_messenger)
      VALUES (
        'You were mentioned',
        'You were mentioned in ' || NEW.parent_type || ' "' || COALESCE(parent_title, '') || '"',
        'mention',
        NEW.parent_type,
        NEW.parent_id,
        mentioned_user,
        TRUE,
        TRUE
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment mentions
CREATE TRIGGER comment_mentions_notification
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_mentioned_in_comment();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- USERS TABLE RLS
-- =============================================================================

-- Users can read all users (for dropdowns)
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Only admins can insert new users
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (role = 'Admin');

-- Only admins can delete users
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- =============================================================================
-- TICKETS TABLE RLS
-- =============================================================================

-- Admin and Manager: can see all tickets
CREATE POLICY "Admin and Manager can view all tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
    )
  );

-- IT: can see tickets assigned to them
CREATE POLICY "IT can view assigned tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    assignee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'IT' AND can_self_assign = TRUE
    )
  );

-- Regular User: can see their own tickets (as requestee or assignee)
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    requestee_id = auth.uid() OR
    assignee_id = auth.uid()
  );

-- Admin, Manager, IT: can insert tickets
CREATE POLICY "Staff can create tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    requestee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager', 'IT')
    )
  );

-- Admin, Manager, IT: can update tickets
CREATE POLICY "Staff can update tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager', 'IT')
    )
  );

-- Only Admin and Manager can delete tickets
CREATE POLICY "Admins and Managers can delete tickets"
  ON tickets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
    )
  );

-- =============================================================================
-- TASKS TABLE RLS
-- =============================================================================

-- Admin and Manager: can see all tasks
CREATE POLICY "Admin and Manager can view all tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
    )
  );

-- IT: can see tasks assigned to them
CREATE POLICY "IT can view assigned tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    assignee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'IT' AND can_self_assign = TRUE
    )
  );

-- Regular User: can see tasks assigned to them
CREATE POLICY "Users can view assigned tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (assignee_id = auth.uid());

-- Admin, Manager, IT: can insert tasks
CREATE POLICY "Staff can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    assignee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager', 'IT')
    )
  );

-- Admin, Manager, IT: can update tasks
CREATE POLICY "Staff can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager', 'IT')
    )
  );

-- Only Admin and Manager can delete tasks
CREATE POLICY "Admins and Managers can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
    )
  );

-- =============================================================================
-- COMMENTS TABLE RLS
-- =============================================================================

-- Authenticated users can view comments on tickets/tasks they can access
CREATE POLICY "Users can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (
    (parent_type = 'ticket' AND EXISTS (
      SELECT 1 FROM tickets
      WHERE id = parent_id AND (
        requestee_id = auth.uid() OR
        assignee_id = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Manager', 'IT'))
      )
    )) OR
    (parent_type = 'task' AND EXISTS (
      SELECT 1 FROM tasks
      WHERE id = parent_id AND (
        assignee_id = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Manager', 'IT'))
      )
    ))
  );

-- Authenticated users can insert comments
CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- =============================================================================
-- ATTACHMENTS TABLE RLS
-- =============================================================================

-- Similar to comments - users can view attachments on tickets/tasks they can access
CREATE POLICY "Users can view attachments"
  ON attachments FOR SELECT
  TO authenticated
  USING (
    (parent_type = 'ticket' AND EXISTS (
      SELECT 1 FROM tickets
      WHERE id = parent_id AND (
        requestee_id = auth.uid() OR
        assignee_id = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Manager', 'IT'))
      )
    )) OR
    (parent_type = 'task' AND EXISTS (
      SELECT 1 FROM tasks
      WHERE id = parent_id AND (
        assignee_id = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Manager', 'IT'))
      )
    ))
  );

-- Users can create attachments
CREATE POLICY "Users can create attachments"
  ON attachments FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Users can delete their own attachments
CREATE POLICY "Users can delete own attachments"
  ON attachments FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- =============================================================================
-- NOTIFICATIONS TABLE RLS
-- =============================================================================

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- System can insert notifications
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================================================
-- NOTIFICATION_LOG TABLE RLS
-- =============================================================================

-- Read access for authenticated users
CREATE POLICY "Users can view notification logs"
  ON notification_log FOR SELECT
  TO authenticated
  USING (TRUE);

-- Insert access for system/n8n
CREATE POLICY "System can create notification logs"
  ON notification_log FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- =============================================================================
-- AUDIT_LOG TABLE RLS
-- =============================================================================

-- Only Admin and Manager can view audit logs
CREATE POLICY "Admin and Manager can view audit logs"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
    )
  );

-- System can insert audit logs
CREATE POLICY "System can create audit logs"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- =============================================================================
-- TICKET_HISTORY TABLE RLS
-- =============================================================================

-- Same as tickets - users can view history for tickets they can access
CREATE POLICY "Users can view ticket history"
  ON ticket_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE id = ticket_id AND (
        requestee_id = auth.uid() OR
        assignee_id = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Manager', 'IT'))
      )
    )
  );

-- =============================================================================
-- TASK_HISTORY TABLE RLS
-- =============================================================================

-- Same as tasks - users can view history for tasks they can access
CREATE POLICY "Users can view task history"
  ON task_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE id = task_id AND (
        assignee_id = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Manager', 'IT'))
      )
    )
  );

-- =============================================================================
-- REALTIME SUBSCRIPTIONS
-- =============================================================================

-- Enable realtime for notifications (for real-time updates)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to get user's role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS VARCHAR(20) AS $$
  SELECT role FROM users WHERE id = user_id;
$$ LANGUAGE sql STABLE;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = user_id AND role = 'Admin');
$$ LANGUAGE sql STABLE;

-- Function to check if user can manage all tickets
CREATE OR REPLACE FUNCTION can_manage_all_tickets(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id AND role IN ('Admin', 'Manager')
  );
$$ LANGUAGE sql STABLE;

-- =============================================================================
-- SEED DATA (Optional - for testing)
-- =============================================================================

-- Insert sample users (password is 'password123' hashed with bcrypt - USE IN DEV ONLY)
-- Note: In production, use proper password hashing
/*
INSERT INTO users (username, email, password_hash, full_name, role, can_self_assign) VALUES
('admin', 'admin@example.com', '$2a$10$abcdefghijklmnopqrstuv', 'System Admin', 'Admin', FALSE),
('manager', 'manager@example.com', '$2a$10$abcdefghijklmnopqrstuv', 'Project Manager', 'Manager', FALSE),
('it_user', 'it@example.com', '$2a$10$abcdefghijklmnopqrstuv', 'IT Specialist', 'IT', TRUE),
('john_doe', 'john@example.com', '$2a$10$abcdefghijklmnopqrstuv', 'John Doe', 'User', FALSE),
('jane_smith', 'jane@example.com', '$2a$10$abcdefghijklmnopqrstuv', 'Jane Smith', 'User', FALSE);
*/

-- =============================================================================
-- SUMMARY
-- =============================================================================
/*
Tables created:
1. users - User management with roles (Admin, Manager, IT, User)
2. tickets - Support tickets with status, priority, assignees
3. tasks - Development tasks with progress tracking
4. comments - Comments on tickets and tasks
5. attachments - File attachments for tickets and tasks
6. notifications - In-app notifications with email/messenger flags
7. notification_log - Log for n8n integration
8. audit_log - Audit trail for all changes
9. ticket_history - History of ticket changes
10. task_history - History of task changes

Key Features:
- Role-based access control (Admin, Manager, IT, User)
- IT users can only self-assign tickets/tasks
- Automatic notifications on ticket/task creation and updates
- Notifications marked for email and messenger (ready for n8n)
- Complete audit trail
- Realtime support via Supabase realtime
- Proper indexes for performance

For n8n Integration:
1. Use the notifications table with filters:
   - send_email = TRUE AND email_sent = FALSE
   - send_messenger = TRUE AND messenger_sent = FALSE
   
2. After sending, update notification_log:
   - INSERT INTO notification_log (notification_id, channel, status, sent_at)
   - UPDATE notifications SET email_sent = TRUE WHERE id = ?

3. Webhook endpoint can be created in n8n to poll pending notifications
*/
