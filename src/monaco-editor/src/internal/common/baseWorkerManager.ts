/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { editor, IDisposable, Uri } from "../../editor";
import { createWebWorker } from "./workers";

const STOP_WHEN_IDLE_FOR = 2 * 60 * 1000; // 2min

export interface WorkerManagerConfig<TWorker extends object, TDefaults> {
  moduleId: string;
  createWorker: () => Worker;
  buildCreateData: (defaults: TDefaults) => Record<string, unknown>;
  label?: string;
}

export interface LanguageServiceDefaultsMinimal {
  readonly languageId: string;
  onDidChange: (listener: () => void) => IDisposable;
}

export class BaseWorkerManager<TWorker extends object, TDefaults extends LanguageServiceDefaultsMinimal = LanguageServiceDefaultsMinimal> {
  private _defaults: TDefaults;
  private _config: WorkerManagerConfig<TWorker, TDefaults>;
  private _idleCheckInterval: number;
  private _lastUsedTime: number;
  private _configChangeListener: IDisposable;

  private _worker: editor.MonacoWebWorker<TWorker> | null;
  private _client: Promise<TWorker> | null;

  constructor(defaults: TDefaults, config: WorkerManagerConfig<TWorker, TDefaults>) {
    this._defaults = defaults;
    this._config = config;
    this._worker = null;
    this._client = null;
    this._idleCheckInterval = window.setInterval(() => this._checkIfIdle(), 30 * 1000);
    this._lastUsedTime = 0;
    this._configChangeListener = this._defaults.onDidChange(() => this._stopWorker());
  }

  private _stopWorker(): void {
    if (this._worker) {
      this._worker.dispose();
      this._worker = null;
    }
    this._client = null;
  }

  dispose(): void {
    clearInterval(this._idleCheckInterval);
    this._configChangeListener.dispose();
    this._stopWorker();
  }

  private _checkIfIdle(): void {
    if (!this._worker) {
      return;
    }
    let timePassedSinceLastUsed = Date.now() - this._lastUsedTime;
    if (timePassedSinceLastUsed > STOP_WHEN_IDLE_FOR) {
      this._stopWorker();
    }
  }

  private _getClient(): Promise<TWorker> {
    this._lastUsedTime = Date.now();

    if (!this._client) {
      this._worker = createWebWorker<TWorker>({
        moduleId: this._config.moduleId,
        createWorker: this._config.createWorker,
        label: this._config.label ?? this._defaults.languageId,
        createData: this._config.buildCreateData(this._defaults),
      });

      // @ts-ignore — upstream monaco type mismatch on getProxy()
      this._client = <Promise<TWorker>>this._worker.getProxy();
    }

    return this._client;
  }

  getLanguageServiceWorker(...resources: Uri[]): Promise<TWorker> {
    let _client: TWorker;
    return this._getClient()
      .then((client) => {
        _client = client;
      })
      .then((_) => {
        if (this._worker) {
          return this._worker.withSyncedResources(resources);
        }
      })
      .then((_) => _client);
  }
}
