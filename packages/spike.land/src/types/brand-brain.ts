import type {
  BrandProfileFormData,
  ColorPaletteItem,
  Guardrail,
  GuardrailSeverity,
  GuardrailType,
  ToneDescriptors,
  VocabularyItem,
  VocabularyType,
} from "@/lib/validations/brand-brain";

// ============================================
// Database Model Types (matching Prisma schema)
// ============================================

export interface BrandProfile {
  id: string;
  workspaceId: string;
  name: string;
  mission: string | null;
  values: string[] | null;
  toneDescriptors: ToneDescriptors | null;
  logoUrl?: string | null;
  logoR2Key?: string | null;
  colorPalette?: ColorPaletteItem[] | null;
  version: number;
  isActive: boolean;
  createdById: string;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandGuardrail {
  id: string;
  brandProfileId: string;
  type: GuardrailType;
  name: string;
  description: string | null;
  severity: GuardrailSeverity;
  ruleConfig: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandVocabulary {
  id: string;
  brandProfileId: string;
  type: VocabularyType;
  term: string;
  replacement: string | null;
  context: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// API Response Types
// ============================================

export interface BrandProfileResponse {
  brandProfile: BrandProfile | null;
  guardrails: BrandGuardrail[];
  vocabulary: BrandVocabulary[];
}

export interface CreateBrandProfileResponse {
  success: boolean;
  brandProfile: BrandProfile;
  guardrails: BrandGuardrail[];
  vocabulary: BrandVocabulary[];
}

export interface UpdateBrandProfileResponse {
  success: boolean;
  brandProfile: BrandProfile;
  guardrails: BrandGuardrail[];
  vocabulary: BrandVocabulary[];
}

export interface BrandAssetUploadResponse {
  success: boolean;
  url: string;
  r2Key: string;
  width?: number;
  height?: number;
  contentType: string;
  size: number;
}

// ============================================
// Wizard State Types
// ============================================

export interface WizardStep {
  title: string;
  description: string;
}

export interface BrandBrainWizardState {
  currentStep: number;
  formData: BrandProfileFormData;
  isDirty: boolean;
  isSubmitting: boolean;
  existingProfile: BrandProfile | null;
}

// ============================================
// Component Props Types
// ============================================

export interface VoiceSliderProps {
  dimension: keyof ToneDescriptors;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export interface ColorPaletteInputProps {
  colors: ColorPaletteItem[];
  onChange: (colors: ColorPaletteItem[]) => void;
  maxColors?: number;
  disabled?: boolean;
}

export interface LogoUploadProps {
  logoUrl: string | undefined;
  onUpload: (url: string, r2Key: string) => void;
  onRemove: () => void;
  workspaceId: string;
  disabled?: boolean;
}

export interface GuardrailListProps {
  guardrails: Guardrail[];
  onChange: (guardrails: Guardrail[]) => void;
  type: GuardrailType;
  disabled?: boolean;
}

export interface VocabularyListProps {
  vocabulary: VocabularyItem[];
  onChange: (vocabulary: VocabularyItem[]) => void;
  disabled?: boolean;
}

// ============================================
// Step Component Props
// ============================================

export interface StepProps {
  disabled?: boolean;
}

// ============================================
// Re-exports from validations for convenience
// ============================================

export type {
  BrandBasicsFormData,
  BrandProfileFormData,
  ColorPaletteItem,
  ColorUsage,
  Guardrail,
  GuardrailSeverity,
  GuardrailsStepFormData,
  GuardrailType,
  ToneDescriptors,
  VisualIdentityFormData,
  VocabularyItem,
  VocabularyType,
  VoiceDimension,
  VoiceToneFormData,
} from "@/lib/validations/brand-brain";

// ============================================
// Re-exports from brand-score for convenience
// ============================================

export type {
  ContentScoreRequest,
  ContentScoreResponse,
  ContentType,
  ContentViolation,
  OverallAssessment,
  Suggestion,
  SuggestionCategory,
  SuggestionPriority,
  ToneAnalysis,
  ViolationLocation,
  ViolationSeverity,
  ViolationType,
} from "@/lib/validations/brand-score";
