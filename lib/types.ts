export interface NavLink {
  name: string;
  href: string;
  icon: React.ElementType;
  active?: boolean;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type?: "ticket" | "task" | "system" | "mention";
}

export interface NavigationBarProps {
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
  notifications?: Notification[];
  navLinks?: NavLink[];
  onSearch?: (query: string) => void;
  onNavigate?: (href: string) => void;
}

export interface ProfileModalProps {
  user?: {
    name: string;
    email: string;
    role: string;
    department?: string;
    avatar?: string;
  };
}

export interface NewTaskModalProps {
  onSubmit?: (task: {
    title: string;
    description: string;
    project: string;
    priority: string;
    assignee: string;
    dueDate: string;
  }) => void;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: "Open" | "In Progress" | "Waiting" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High" | "Urgent";
  assignee: {
    name: string;
    avatar: string;
  };
  reporter: {
    name: string;
    avatar: string;
  };
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  tags: string[];
  comments: number;
  attachments: number;
}

export interface TicketDetailModalProps {
  children: React.ReactNode;
  ticket: Ticket;
  onStatusChange?: (ticketId: string, newStatus: string) => void;
}

export interface NewTicketModalProps {
  onSubmit?: (ticket: {
    title: string;
    description: string;
    issueType: string;
    priority: string;
    assignee: string;
  }) => void;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "To Do" | "In Progress" | "In Review" | "Completed";
  priority: "Low" | "Medium" | "High" | "Urgent";
  project: string;
  assignee: {
    name: string;
    avatar: string;
  };
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
}

export interface TaskDetailModalProps {
  children: React.ReactNode;
  task: Task;
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

export interface Designation {
  name: string;
}

export interface Role {
  name: string;
}

export interface Assignment {
  designation_id: number;
  role_id: number;
  designation: Designation;
  role: Role;
}

// Main user interface
export interface UserProfile {
  user_id: number;
  auth_user_id: string;
  username: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  birthday: string; // ISO string
  sex: string;
  mobile_number: string;
  address?: string;
  created_at: string; // ISO string
  assignment?: Assignment;
}