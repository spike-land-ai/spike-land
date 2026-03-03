// Lazy-loaded external shim: re-exports RecordRTC as a separate chunk so
// screen/audio recording is only loaded when the feature is activated.
import recordRTC from "recordrtc";
export default recordRTC;
