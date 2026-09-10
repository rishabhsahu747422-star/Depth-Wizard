export const getHeightData = (
  heightmapBase64,
  heightMin = 0,
  heightMax = 1,
) => {
  // This function expects a base64 heightmap image.
  // It converts grayscale pixels into terrain heights.

  if (!heightmapBase64) {
    return null;
  }

  const image = new Image();

  // NOTE:
  // This function is asynchronous in reality, so don't use this
  // version unless your existing project already expects synchronous data.
};
