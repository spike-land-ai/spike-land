/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BaseWorkerManager } from "../../../internal/common/baseWorkerManager";
import type { LanguageServiceDefaults } from "./register";
import type { CSSWorker } from "./cssWorker";

export class WorkerManager extends BaseWorkerManager<CSSWorker, LanguageServiceDefaults> {
  constructor(defaults: LanguageServiceDefaults) {
    super(defaults, {
      moduleId: "vs/language/css/cssWorker",
      createWorker: () =>
        new Worker(new URL("./css.worker?esm", import.meta.url), { type: "module" }),
      buildCreateData: (d) => ({
        options: d.options,
        languageId: d.languageId,
      }),
    });
  }
}
