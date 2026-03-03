// Lazy-loaded external shim: wraps html2canvas-pro so it can be dynamically
// imported as a separate chunk, avoiding it in the main bundle.
import htmlCanvas from "html2canvas-pro";
export default htmlCanvas;
