'use client'

interface ContentHeaderProps {
  title: string;
  description?: string | React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export function ContentHeader({ title, description, action, children }: ContentHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="md:flex md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="mt-4 flex md:ml-4 md:mt-0">
            {action}
          </div>
        )}
      </div>
      {children && (
        <div className="border-t border-gray-200 pt-4">
          {children}
        </div>
      )}
    </div>
  );
} 