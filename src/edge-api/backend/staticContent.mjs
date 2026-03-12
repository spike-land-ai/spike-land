import { md5 } from "@spike-land-ai/code";
import ASSET_MANIFEST from "__STATIC_CONTENT_MANIFEST";

export { ASSET_MANIFEST };

const f = JSON.parse(ASSET_MANIFEST);
export const ASSET_HASH = md5(ASSET_MANIFEST);
export const files = f;
