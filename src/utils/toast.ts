export const showToast = ({
  message,
  duration = 3000,
  position = 'top',
  style = {}
}: {
  message: string;
  duration?: number;
  position?: 'top' | 'bottom';
  style?: React.CSSProperties;
}) => {
  const toast = document.createElement('div');
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    [position]: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '1000',
    backgroundColor: '#4CAF50',
    color: '#fff',
    fontSize: '16px',
    padding: '12px',
    borderRadius: '10px',
    ...style
  });

  document.body.appendChild(toast);

  setTimeout(() => {
    document.body.removeChild(toast);
  }, duration);
};
