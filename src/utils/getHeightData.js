import UPNG from "upng-js";

/**
 * Decode DepthWizard's 16-bit grayscale heightmap.
 *
 * Backend contract:
 * - heightmap_png_b64: base64 encoded PNG
 * - height_min: minimum real height
 * - height_max: maximum real height
 *
 * Returns:
 * {
 *   width: number,
 *   height: number,
 *   data: Float32Array
 * }
 *
 * This utility contains NO React or Three.js logic.
 * It only converts the backend heightmap into numeric heights.
 */
export const getHeightData = (
  heightmapBase64,
  heightMin = 0,
  heightMax = 1,
) => {
  if (!heightmapBase64) {
    throw new Error("Heightmap data is missing.");
  }

  if (
    typeof heightMin !== "number" ||
    typeof heightMax !== "number" ||
    !Number.isFinite(heightMin) ||
    !Number.isFinite(heightMax)
  ) {
    throw new Error("Invalid height range.");
  }

  if (heightMax < heightMin) {
    throw new Error("height_max must be greater than height_min.");
  }

  try {
    // --------------------------------------------------------
    // Decode base64 → binary
    // --------------------------------------------------------

    const binaryString = atob(heightmapBase64);

    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // --------------------------------------------------------
    // Decode PNG while preserving bit depth
    // --------------------------------------------------------

    const image = UPNG.decode(bytes.buffer);

    if (!image) {
      throw new Error("Unable to decode heightmap PNG.");
    }

    const width = image.width;
    const height = image.height;
    const depth = image.depth;
    const colorType = image.ctype;

    if (!width || !height) {
      throw new Error("Heightmap has invalid dimensions.");
    }

    /*
     * DepthWizard heightmaps are expected to be:
     *
     * 16-bit grayscale PNG
     *
     * PNG grayscale color type = 0
     *
     * We intentionally do NOT use canvas.getImageData()
     * because that would reduce the source to 8-bit values.
     */
    if (depth !== 16) {
      throw new Error(
        `Unsupported heightmap bit depth: ${depth}-bit. Expected 16-bit.`,
      );
    }

    if (colorType !== 0) {
      throw new Error(
        `Unsupported heightmap color type: ${colorType}. Expected grayscale.`,
      );
    }

    // --------------------------------------------------------
    // Extract raw 16-bit grayscale samples
    // --------------------------------------------------------

    const rawData = image.data;

    if (!rawData) {
      throw new Error("Decoded heightmap contains no pixel data.");
    }

    if (!(rawData instanceof Uint16Array)) {
      throw new Error(
        "Heightmap decoder did not return 16-bit grayscale data.",
      );
    }

    const expectedPixels = width * height;

    if (rawData.length < expectedPixels) {
      throw new Error(
        `Heightmap data is incomplete. Expected ${expectedPixels} pixels but received ${rawData.length}.`,
      );
    }

    // --------------------------------------------------------
    // Convert 0–65535 → real height range
    // --------------------------------------------------------

    const data = new Float32Array(expectedPixels);

    const heightRange = heightMax - heightMin;

    for (let i = 0; i < expectedPixels; i++) {
      const normalized = rawData[i] / 65535;

      data[i] = heightMin + normalized * heightRange;
    }

    return {
      width,
      height,
      data,
    };
  } catch (error) {
    console.error("Heightmap decoding failed:", error);

    throw new Error(
      error?.message || "Failed to decode the terrain heightmap.",
    );
  }
};

export default getHeightData;
