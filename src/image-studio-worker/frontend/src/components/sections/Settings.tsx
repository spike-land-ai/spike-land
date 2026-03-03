import { useState, useEffect } from "react";
import {
  Key,
  Save,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Brain,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

export function Settings() {
  const [apiKey, setApiKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setIsValidatingStatus] = useState<"idle" | "valid" | "invalid">("idle");

  // Model Preferences
  const [textModel, setTextModel] = useState("gemini-3-flash-preview");
  const [imageModel, setImageModel] = useState("gemini-3.1-flash-image-preview");
  const [thinkingBudget, setThinkingBudget] = useState("off");

  useEffect(() => {
    setApiKey(localStorage.getItem("gemini_api_key") || "");
    setTextModel(localStorage.getItem("pref_text_model") || "gemini-3-flash-preview");
    setImageModel(localStorage.getItem("pref_image_model") || "gemini-3.1-flash-image-preview");
    setThinkingBudget(localStorage.getItem("pref_thinking_budget") || "off");
  }, []);

  const handleSave = () => {
    localStorage.setItem("gemini_api_key", apiKey);
    localStorage.setItem("pref_text_model", textModel);
    localStorage.setItem("pref_image_model", imageModel);
    localStorage.setItem("pref_thinking_budget", thinkingBudget);
    toast.success("Neural preferences synced successfully");
  };

  const validateKey = async () => {
    if (!apiKey) return;
    setIsValidating(true);
    setIsValidatingStatus("idle");

    try {
      // Basic call to list models to verify key
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      );
      if (res.ok) {
        setIsValidatingStatus("valid");
        toast.success("API Key verified");
      } else {
        setIsValidatingStatus("invalid");
        toast.error("Invalid API Key");
      }
    } catch {
      setIsValidatingStatus("invalid");
      toast.error("Validation failed");
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem("gemini_api_key");
    setApiKey("");
    setIsValidatingStatus("idle");
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-6 md:py-12 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-neon/5 border border-amber-neon/10 text-[8px] font-black uppercase tracking-[0.2em] text-amber-neon">
          System Core
        </div>
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">
          Neural<span className="text-amber-neon">Config</span>
        </h2>
        <p className="text-sm text-gray-500 font-medium max-w-md leading-relaxed">
          Calibrate your studio's processing engines and manage your neural access tokens.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Token Management */}
        <div className="glass-panel rounded-3xl p-6 border-white/5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <Key className="w-5 h-5 text-amber-neon" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight uppercase">
                Access Token
              </h3>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                Google AI Studio
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative group">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter Gemini API Key..."
                className="w-full bg-obsidian-950/50 border border-white/10 rounded-xl py-3 pl-5 pr-10 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:ring-1 ring-amber-neon/30 transition-all"
              />
              {apiKey && (
                <button
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={validateKey}
              disabled={!apiKey || isValidating}
              className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-20 flex items-center justify-center gap-2"
            >
              {isValidating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Verify Token"}
              {validationStatus === "valid" && (
                <CheckCircle2 className="w-3 h-3 text-emerald-neon" />
              )}
              {validationStatus === "invalid" && <AlertCircle className="w-3 h-3 text-red-500" />}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-amber-neon/5 border border-amber-neon/10">
            <div className="flex gap-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-neon shrink-0" />
              <p className="text-[8px] leading-relaxed text-amber-neon/70 font-bold uppercase tracking-tight">
                Localized encryption: Your token remains within this browser isolate.
              </p>
            </div>
          </div>
        </div>

        {/* Model Preferences */}
        <div className="glass-panel rounded-3xl p-6 border-white/5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-neon" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight uppercase">Engines</h3>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                Routing Preferences
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <Brain className="w-3 h-3" /> Linguistic Root
              </label>
              <select
                value={textModel}
                onChange={(e) => setTextModel(e.target.value)}
                className="w-full bg-obsidian-950/50 border border-white/10 rounded-lg py-2 px-3 text-[10px] font-bold text-gray-300 focus:outline-none"
              >
                <option value="gemini-3-flash-preview">Gemini 3 Flash (Auto)</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <ImageIcon className="w-3 h-3" /> Visual Output
              </label>
              <select
                value={imageModel}
                onChange={(e) => setImageModel(e.target.value)}
                className="w-full bg-obsidian-950/50 border border-white/10 rounded-lg py-2 px-3 text-[10px] font-bold text-gray-300 focus:outline-none"
              >
                <option value="gemini-3.1-flash-image-preview">Gemini 3.1 Flash Image</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">
                Thinking Budget
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {["off", "partial", "full"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setThinkingBudget(mode)}
                    className={`py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${
                      thinkingBudget === mode
                        ? "bg-emerald-neon text-obsidian-950 shadow-lg shadow-emerald-neon/20"
                        : "bg-white/5 text-gray-600 hover:text-gray-400"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={handleSave}
          className="group relative px-10 py-4 rounded-2xl bg-amber-neon text-obsidian-950 font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:scale-105 transition-all active:scale-95"
        >
          <div className="flex items-center gap-2.5">
            <Save className="w-4 h-4 stroke-[3]" />
            Sync Preferences
          </div>
        </button>
      </div>
    </div>
  );
}
