/**
 * Format bytes to human readable format
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format a date to a readable string
 */
export const formatDate = (date: Date | null): string => {
  if (!date) return 'Never';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay > 30) {
    return date.toLocaleDateString();
  } else if (diffDay > 0) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  } else if (diffHour > 0) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  } else if (diffMin > 0) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

/**
 * Create a color based on a value
 */
export const getColorForValue = (value: number, max: number): string => {
  const percentage = Math.min(value / max, 1);
  
  // Color spectrum from green to yellow to red
  if (percentage < 0.5) {
    // Green to yellow
    const r = Math.floor(255 * (percentage * 2));
    return `rgb(${r}, 255, 0)`;
  } else {
    // Yellow to red
    const g = Math.floor(255 * (1 - (percentage - 0.5) * 2));
    return `rgb(255, ${g}, 0)`;
  }
}; 