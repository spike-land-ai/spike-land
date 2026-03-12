/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { initialize } from "../../../internal/common/initialize";
import { CSSWorker, type ICreateData } from "./cssWorker";
import type { worker } from "../../../editor";

self.onmessage = () => {
  // ignore the first message
  initialize((ctx: worker.IWorkerContext, createData: ICreateData) => {
    return new CSSWorker(ctx, createData);
  });
};
