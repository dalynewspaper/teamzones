export async function isLogoLight(imageUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      // Create canvas and get context
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        resolve(false);
        return;
      }

      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image on canvas
      context.drawImage(img, 0, 0);

      try {
        // Get image data
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let totalPixels = 0;
        let lightPixels = 0;
        const threshold = 200; // Threshold for considering a pixel "light"

        // Analyze every pixel (RGBA values)
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Skip transparent pixels
          if (a < 128) continue;

          totalPixels++;
          
          // Calculate brightness using perceived brightness formula
          const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
          if (brightness > threshold) {
            lightPixels++;
          }
        }

        // If more than 70% of pixels are light, consider it a light logo
        resolve(totalPixels > 0 && (lightPixels / totalPixels) > 0.7);
      } catch (error) {
        console.error('Error analyzing image:', error);
        resolve(false);
      }
    };

    img.onerror = () => {
      console.error('Error loading image for analysis');
      resolve(false);
    };

    img.src = imageUrl;
  });
} 