export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });
};

export const formatDateTime = (date) => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 }
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count > 0) return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
};

export const getSeverityColor = (severity) => {
  const colors = {
    critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e'
  };
  return colors[severity] || '#6b7280';
};

export const getStatusColor = (status) => {
  const colors = {
    open: '#ef4444', investigating: '#eab308', resolved: '#22c55e', false_alarm: '#6b7280'
  };
  return colors[status] || '#6b7280';
};
