import { XCircleIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

const icons = {
  error: XCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

const styles = {
  error: 'bg-red-50 text-red-800',
  success: 'bg-green-50 text-green-800',
  warning: 'bg-yellow-50 text-yellow-800',
  info: 'bg-blue-50 text-blue-800',
};

const iconStyles = {
  error: 'text-red-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
};

interface AlertProps {
  type: keyof typeof styles;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ type, title, children, className }: AlertProps) {
  const Icon = icons[type];

  return (
    <div className={cn('rounded-md p-4', styles[type], className)}>
      <div className="flex">
        <Icon className={cn('h-5 w-5', iconStyles[type])} aria-hidden="true" />
        <div className="ml-3">
          {title && (
            <h3 className="text-sm font-medium">{title}</h3>
          )}
          <div className={cn('text-sm', title && 'mt-2')}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 