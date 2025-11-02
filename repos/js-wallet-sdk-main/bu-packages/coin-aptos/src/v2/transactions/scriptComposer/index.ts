// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { ScriptComposerWasm } from "@aptos-labs/script-composer-pack";
import { AptosConfig } from "../../api/aptosConfig";

/**
 * A wrapper class around TransactionComposer, which is a WASM library compiled
 * from aptos-core/aptos-move/script-composer.
 * This class allows the SDK caller to build a transaction that invokes multiple Move functions
 * and allow for arguments to be passed around.
 * */
export class AptosScriptComposer {
  private config: AptosConfig;

  private builder?: any;

  private static transactionComposer?: any;

  constructor(aptosConfig: AptosConfig) {
    this.config = aptosConfig;
    this.builder = undefined;
  }

  // Initializing the wasm needed for the script composer, must be called
  // before using the composer.
  async init() {
    if (!AptosScriptComposer.transactionComposer) {
      const module = await import("@aptos-labs/script-composer-pack");
      const { TransactionComposer, initSync } = module;
      if (!ScriptComposerWasm.isInitialized) {
        ScriptComposerWasm.init();
      }
      initSync({ module: ScriptComposerWasm.wasm });
      AptosScriptComposer.transactionComposer = TransactionComposer;
    }
    this.builder = AptosScriptComposer.transactionComposer.single_signer();
  }

  build(): Uint8Array {
    return this.builder.generate_batched_calls(true);
  }
}
