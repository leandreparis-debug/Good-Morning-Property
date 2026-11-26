/**
 * Background photo settings. To change the photo, only `public/images/`
 * and these constants change (then run `pnpm optimize:background`).
 */
export const BACKGROUND_SRC = "/images/background-hills.jpg";
export const BACKGROUND_WIDTH = 2400;
export const BACKGROUND_HEIGHT = 1600;

/**
 * `object-position` of the photo. The source (3:2) has sky on its top two thirds
 * and grass on the bottom third, a path on the right.
 * - y 75 %: on wide screens (16:9, projection) the crop keeps the grass band at the bottom.
 * - x 40 %: on portrait phones the crop keeps the left hill and the clouds.
 */
export const BACKGROUND_POSITION = "40% 75%";

/**
 * `sizes` of the photo. With `object-cover`, a screen narrower than 3:2 (any phone in portrait)
 * crops the sides, so the image must be 150 % of the viewport height wide, not 100vw:
 * a 390×844 phone then gets the ~1200 px version instead of a blurry 640 px one.
 */
export const BACKGROUND_SIZES = "(max-aspect-ratio: 3/2) 150vh, 100vw";

export const BACKGROUND_CREDIT = {
  author: "Spencer DeMera",
  source: "Unsplash",
  url: "https://unsplash.com/photos/q0lB6w0z6Ns",
} as const;
