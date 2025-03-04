import React from 'react';
import { Bell, Mail, Zap } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  notification_settings?: {
    email_notifications_enabled: boolean;
    notification_email?: string;
    notification_frequency: 'daily' | 'weekly' | 'instant';
    instant_notifications_enabled?: boolean;
  };
}

interface NotificationsSectionProps {
  profile: UserProfile;
  unsavedChanges: boolean;
  saving: boolean;
  onFieldChange: (field: string, value: any) => void;
  onSave: () => void;
}

export function NotificationsSection({
  profile,
  unsavedChanges,
  saving,
  onFieldChange,
  onSave
}: NotificationsSectionProps) {
  // Hardcoded for testing
  const isTestUser = profile?.email === 'nifyacorp@gmail.com';

  const handleToggleEmailNotifications = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange('notification_settings.email_notifications_enabled', e.target.checked);
  };

  const handleNotificationEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange('notification_settings.notification_email', e.target.value);
  };

  const handleFrequencyChange = (frequency: 'daily' | 'weekly' | 'instant') => {
    onFieldChange('notification_settings.notification_frequency', frequency);
  };

  const handleToggleInstantNotifications = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange('notification_settings.instant_notifications_enabled', e.target.checked);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notifications</h3>
        <p className="text-sm text-gray-500">Configure how you receive notifications.</p>
      </div>
      <div className="space-y-4">
        <div className="flex items-start">
          <div className="flex h-5 items-center">
            <input
              id="email-notifications"
              name="email-notifications"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={profile?.notification_settings?.email_notifications_enabled || false}
              onChange={handleToggleEmailNotifications}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="email-notifications" className="font-medium text-gray-700">
              Email notifications
            </label>
            <p className="text-gray-500">Get notified when new matches are found for your subscriptions.</p>
          </div>
        </div>

        {profile?.notification_settings?.email_notifications_enabled && (
          <div>
            <label htmlFor="notification-email" className="block text-sm font-medium text-gray-700">
              Notification email
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <div className="relative flex flex-grow items-stretch focus-within:z-10">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="email"
                  name="notification-email"
                  id="notification-email"
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="you@example.com"
                  value={profile?.notification_settings?.notification_email || profile?.email || ''}
                  onChange={handleNotificationEmailChange}
                />
              </div>
            </div>
          </div>
        )}

        {profile?.notification_settings?.email_notifications_enabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Notification frequency</label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  id="frequency-daily"
                  name="notification-frequency"
                  type="radio"
                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={profile?.notification_settings?.notification_frequency === 'daily'}
                  onChange={() => handleFrequencyChange('daily')}
                />
                <label htmlFor="frequency-daily" className="ml-3 block text-sm font-medium text-gray-700">
                  Daily digest
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="frequency-weekly"
                  name="notification-frequency"
                  type="radio"
                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={profile?.notification_settings?.notification_frequency === 'weekly'}
                  onChange={() => handleFrequencyChange('weekly')}
                />
                <label htmlFor="frequency-weekly" className="ml-3 block text-sm font-medium text-gray-700">
                  Weekly digest
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="frequency-instant"
                  name="notification-frequency"
                  type="radio"
                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={profile?.notification_settings?.notification_frequency === 'instant'}
                  onChange={() => handleFrequencyChange('instant')}
                />
                <label htmlFor="frequency-instant" className="ml-3 block text-sm font-medium text-gray-700">
                  Instant
                </label>
              </div>
            </div>
          </div>
        )}

        {isTestUser && profile?.notification_settings?.email_notifications_enabled && profile?.notification_settings?.notification_frequency === 'instant' && (
          <div className="flex items-start">
            <div className="flex h-5 items-center">
              <input
                id="instant-notifications"
                name="instant-notifications"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                checked={profile?.notification_settings?.instant_notifications_enabled || false}
                onChange={handleToggleInstantNotifications}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="instant-notifications" className="font-medium text-gray-700 flex items-center">
                <Zap className="h-4 w-4 mr-1 text-yellow-500" />
                Instant notifications
              </label>
              <p className="text-gray-500">Receive notifications immediately when matches are found.</p>
            </div>
          </div>
        )}
      </div>

      {unsavedChanges && (
        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      )}
    </div>
  );
}