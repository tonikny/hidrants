import React, { useState } from 'react';
import type { HydrantImage } from '../../utils/osmConversion';

interface HydrantImagesProps {
  images: HydrantImage[];
}

const SingleImage: React.FC<{ img: HydrantImage; index: number }> = ({
  img,
  index,
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {return null;}

  return (
    <a
      href={img.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-[80px] mb-[4px] w-fit"
    >
      <img
        src={img.thumbnail}
        alt={`Hidrant ${index + 1}`}
        className="h-[80px] w-auto max-w-[120px] object-contain rounded-[6px] block"
        onError={() => setHasError(true)}
      />
    </a>
  );
};

export const HydrantImages: React.FC<HydrantImagesProps> = ({ images }) => {
  if (!images || images.length === 0) {return null;}

  const displayImages = images.slice(0, 3);

  return (
    <div className="flex flex-col items-end gap-[4px] shrink-0">
      {displayImages.map((img, index) => (
        <SingleImage key={index} img={img} index={index} />
      ))}
    </div>
  );
};
