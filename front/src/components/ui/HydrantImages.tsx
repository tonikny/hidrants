import React, { useState } from 'react';
import { HydrantImage } from '../../utils/osmConversion';

interface HydrantImagesProps {
  images: HydrantImage[];
}

const SingleImage: React.FC<{ img: HydrantImage; index: number }> = ({
  img,
  index,
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) return null;

  return (
    <a
      href={img.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ 
        display: 'block',
        height: '80px',
        marginBottom: '4px',
        width: 'fit-content'
      }}
    >
      <img
        src={img.thumbnail}
        alt={`Hidrant ${index + 1}`}
        style={{
          height: '80px',
          width: 'auto',
          maxWidth: '120px',
          objectFit: 'contain',
          borderRadius: '6px',
          display: 'block',
        }}
        onError={() => setHasError(true)}
      />
    </a>
  );
};

export const HydrantImages: React.FC<HydrantImagesProps> = ({ images }) => {
  if (!images || images.length === 0) return null;

  const displayImages = images.slice(0, 3);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '4px',
        flexShrink: 0,
      }}
    >
      {displayImages.map((img, index) => (
        <SingleImage key={index} img={img} index={index} />
      ))}
    </div>
  );
};
