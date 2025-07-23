import React from 'react';

const Image = ({ src, alt }: { src: string; alt: string }) => {
  return (
    <img loading="lazy" src={`${src}.webp`} alt={alt} />
  );
};

export default Image;
