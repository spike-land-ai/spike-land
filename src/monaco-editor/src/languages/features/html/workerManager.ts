/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BaseWorkerManager } from "../../../internal/common/baseWorkerManager";
import type { LanguageServiceDefaults } from "./register";
import type { HTMLWorker } from "./htmlWorker";

export class WorkerManager extends BaseWorkerManager<HTMLWorker, LanguageServiceDefaults> {
  constructor(defaults: LanguageServiceDefaults) {
    super(defaults, {
      moduleId: "vs/language/html/htmlWorker",
      createWorker: () =>
        new Worker(new URL("./html.worker?esm", import.meta.url), { type: "module" }),
      buildCreateData: (d) => ({
        languageSettings: d.options,
        languageId: d.languageId,
      }),
    });
  }
}
