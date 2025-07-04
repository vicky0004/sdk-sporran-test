import { Tokens, Network } from "./payments";
import {MiniKitInstallErrorCodes, MiniKitInstallErrorMessage} from "./errors";
import type { MiniAppInitSuccessPayload } from "./responses";
export enum Command {
  Pay = 'pay',
  init= 'init',
}

export type WebViewBasePayload = {
  command: Command;
  payload: Record<string, any>;
};

export type PayCommandInput = {
  amount: number;
  to: string; // wallet Address or web3name
  tip: number;
  fee: number;
  network?: Network;
  token_symbol: Tokens;
  description: string;
};

export type PayCommandPayload = PayCommandInput;

export type InitCommandPayload = {
  status?: string;
  did?: string;
  web3name?: string;
  walletAddress?: string;
  email?: string;
  name?: string;
  message?: string;
};

type CommandReturnPayloadMap = {
  [Command.Pay]: PayCommandPayload;
  [Command.init]:InitCommandPayload;
};
export type CommandReturnPayload<T extends Command> =
  T extends keyof CommandReturnPayloadMap ? CommandReturnPayloadMap[T] : never;

export type AsyncHandlerReturn<CommandPayload, FinalPayload> = Promise<{
  commandPayload: CommandPayload;
  finalPayload: FinalPayload;
}>;

export type MiniKitInstallReturnType =
  | { success: true, initResult: MiniAppInitSuccessPayload }
  | {
      success: false;
      errorCode: MiniKitInstallErrorCodes;
      errorMessage: (typeof MiniKitInstallErrorMessage)[MiniKitInstallErrorCodes];
    };