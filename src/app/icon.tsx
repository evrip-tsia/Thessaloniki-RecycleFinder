
import { ImageResponse } from 'next/og';
import { Recycle } from 'lucide-react';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24, // Size of the icon itself
          background: 'hsl(0 0% 3.9%)', // Dark background, similar to app's dark theme --background
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'hsl(147 39% 49%)', // Primary green color for the icon
          borderRadius: '4px', // Slightly rounded corners for the favicon background
        }}
      >
        <Recycle strokeWidth={2.5} />
      </div>
    ),
    {
      ...size,
    }
  );
}
