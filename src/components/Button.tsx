import React from 'react';

const Button = ({ label, onClick }: { label: string; onClick: () => void }) => {
  return (
    <button aria-label={label} onClick={onClick}>
      {label}
    </button>
  );
};

export default Button;
