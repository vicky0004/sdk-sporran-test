export enum ResponseEvent {
  MiniAppPayment = 'miniapp-payment',
  Init = 'init'
}
import { Network } from './payments';
import { PaymentErrorCodes } from './errors';
export type MiniAppPaymentSuccessPayload = {
  status: string;
  transaction_status: 'submitted';
  transaction_id: string;
  reference: string;
  from: string;
  chain: Network;
  timestamp: string;
  version: number;
};

export type MiniAppPaymentErrorPayload = {
  status: string;
  error_code: PaymentErrorCodes;
  version: number;
};

export type MiniAppPaymentPayload =
  | MiniAppPaymentSuccessPayload
  | MiniAppPaymentErrorPayload;

export type MiniAppInitSuccessPayload = {
  status: string;
  did?: string;
  web3Name?: string;
  email?: string;
  name?: string;
}
export type MiniAppInitErrorPayload = {
  status: string;
  message: string;
};
export type MiniAppInitPayload = MiniAppInitSuccessPayload | MiniAppInitErrorPayload  ;

type EventPayloadMap = {
  [ResponseEvent.MiniAppPayment]: MiniAppPaymentPayload;
  [ResponseEvent.Init]: MiniAppInitPayload
};

export type EventPayload<T extends ResponseEvent = ResponseEvent> =
  T extends keyof EventPayloadMap ? EventPayloadMap[T] : never;

export type EventHandler<E extends ResponseEvent = ResponseEvent> = <
  T extends EventPayload<E>,
>(
  data: T,
) => void;