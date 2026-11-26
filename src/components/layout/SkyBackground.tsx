import Image from "next/image";
import { BACKGROUND_POSITION, BACKGROUND_SIZES, BACKGROUND_SRC } from "@/lib/background";
import { BACKGROUND_BLUR_DATA_URL } from "@/lib/backgroundBlur";

/**
 * Full-screen photo behind the content (sky on top, grass at the bottom), decorative.
 * A light `mist` veil (35 % → transparent at 60 % height) keeps text on the sky AA-readable.
 * `sky` shows while the photo loads.
 */
export function SkyBackground() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-sky">
      <Image
        src={BACKGROUND_SRC}
        alt=""
        fill
        priority
        sizes={BACKGROUND_SIZES}
        quality={80}
        placeholder="blur"
        blurDataURL={BACKGROUND_BLUR_DATA_URL}
        className="object-cover"
        style={{ objectPosition: BACKGROUND_POSITION }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(234_243_252/0.35)_0%,rgb(234_243_252/0)_60%)]" />
    </div>
  );
}
