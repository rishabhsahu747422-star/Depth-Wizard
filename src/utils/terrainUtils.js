export const loadImageFromBase64 = (base64) => {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve(image);
    };

    image.onerror = () => {
      reject(new Error("Unable to load heightmap image."));
    };

    image.src = `data:image/png;base64,${base64}`;
  });
};

export const getHeightData = async (heightmapBase64, heightMin, heightMax) => {
  const image = await loadImageFromBase64(heightmapBase64);

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  canvas.width = image.width;
  canvas.height = image.height;

  context.drawImage(image, 0, 0);

  const imageData = context.getImageData(0, 0, image.width, image.height);

  const pixels = imageData.data;
  const heights = new Float32Array(image.width * image.height);

  for (let i = 0; i < heights.length; i++) {
    const pixelIndex = i * 4;

    const red = pixels[pixelIndex];
    const green = pixels[pixelIndex + 1];
    const blue = pixels[pixelIndex + 2];

    const normalizedHeight = (red + green + blue) / (255 * 3);

    heights[i] = heightMin + normalizedHeight * (heightMax - heightMin);
  }

  return {
    heights,
    width: image.width,
    height: image.height,
  };
};
