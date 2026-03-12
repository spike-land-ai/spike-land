/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as workerBootstrap from "../../../internal/common/initialize";
import { HTMLWorker, type ICreateData } from "./htmlWorker";
import type { worker } from "../../../editor";

self.onmessage = () => {
  // ignore the first message
  workerBootstrap.initialize((ctx: worker.IWorkerContext, createData: ICreateData) => {
    return new HTMLWorker(ctx, createData);
  });
};
