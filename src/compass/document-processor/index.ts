/**
 * @compass/document-processor
 *
 * Public surface of the COMPASS Document Processor.  Import specific
 * sub-paths for tree-shakeable bundles:
 *
 *   import { FormFiller } from "@compass/document-processor/form-filler"
 *   import { generateChecklist } from "@compass/document-processor/checklist-generator"
 *   import { explainField } from "@compass/document-processor/plain-language"
 *
 * Or import everything from the root for convenience:
 *
 *   import { FormFiller, generateChecklist, explainField } from "@compass/document-processor"
 */

// Types
export type {
  ChecklistItem,
  DocumentChecklist,
  FieldType,
  FieldValidation,
  FilledForm,
  FormField,
  FormTemplate,
  PrerequisiteDocument,
  ProcessStep,
  ValidationResult,
} from "./types.js";

// Checklist generator
export {
  generateChecklist,
  getPrerequisites,
  validateCompleteness,
} from "./core-logic/checklist-generator.js";

// Form filler
export { FormFiller, validateAgainstRules } from "./core-logic/form-filler.js";
export type { UserProfile } from "./core-logic/form-filler.js";

// Plain language
export {
  explainField,
  explainForm,
  translateLegalese,
} from "./core-logic/plain-language.js";
