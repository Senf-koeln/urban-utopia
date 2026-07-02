import { memo } from "react";
import SVG from "react-inlinesvg";
// Import the SVG content as a raw string using Vite's `?raw` suffix
// This instructs Vite to bundle the SVG content directly into the main bundle
import spriteContent from "./icons.svg?raw";

const IconSprite = () => <SVG src={spriteContent} />;

IconSprite.displayName = "IconSprite";
export default memo(IconSprite);
