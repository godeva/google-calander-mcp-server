/**
 * Core types used throughout the application
 */

// Re-export Express types
export * from './express';

/**
 * MCP Command Handler function type
 */
export type CommandHandler = (
  command: string,
  parameters: Record<string, any>,
  context: CommandContext
) => Promise<CommandResult>;

/**
 * Context provided to command handlers
 */
export interface CommandContext {
  userId?: string;
  userEmail?: string;
  requestId: string;
  timestamp: string;
  sessionData?: Record<string, any>;
}

/**
 * Result of command execution
 */
export interface CommandResult {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Authentication token structure
 */
export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
  scope: string[];
}

/**
 * User profile information
 */
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  locale?: string;
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

/**
 * Calendar event structure
 */
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: Array<{
    email: string;
    name?: string;
    optional?: boolean;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  recurrence?: string[];
  reminderSettings?: {
    useDefault: boolean;
    reminders?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  calendarId: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    email: string;
    self?: boolean;
  };
  organizer?: {
    email: string;
    self?: boolean;
  };
  status: 'confirmed' | 'tentative' | 'cancelled';
}

/**
 * Google Doc structure
 */
export interface GoogleDoc {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  folderId?: string;
  folderName?: string;
  owner: {
    email: string;
    name?: string;
  };
  permissions: Array<{
    email: string;
    role: 'owner' | 'writer' | 'commenter' | 'reader';
    type: 'user' | 'group' | 'domain' | 'anyone';
  }>;
}

/**
 * User preference settings
 */
export interface UserPreferences {
  userId: string;
  defaultCalendarId?: string;
  defaultReminderSettings?: {
    useDefault: boolean;
    reminders?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  defaultMeetingDuration?: number; // In minutes
  workingHours?: {
    daysOfWeek: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
    startTime: string; // Format: 'HH:MM'
    endTime: string; // Format: 'HH:MM'
  };
  timezone?: string;
  preferredLanguage?: string;
  preferredAiModel?: string;
  updatedAt: Date;
}