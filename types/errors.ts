export enum PaymentErrorCodes {
  InputError = 'input_error',
  UserRejected = 'user_rejected',
  PaymentRejected = 'payment_rejected',
  InvalidReceiver = 'invalid_receiver',
  InsufficientBalance = 'insufficient_balance',
  TransactionFailed = 'transaction_failed',
  GenericError = 'generic_error',
  UserBlocked = 'user_blocked',
}


export enum MiniKitInstallErrorCodes {
  Unknown = 'unknown',
  AlreadyInstalled = 'already_installed',
  OutsideOfSporranApp = 'outside_of_sporran_app',
  NotOnClient = 'not_on_client',
  AppOutOfDate = 'app_out_of_date',
}

export const MiniKitInstallErrorMessage = {
  [MiniKitInstallErrorCodes.Unknown]: 'Failed to install MiniKit.',
  [MiniKitInstallErrorCodes.AlreadyInstalled]: 'MiniKit is already installed.',
  [MiniKitInstallErrorCodes.OutsideOfSporranApp]:
    'MiniApp launched outside of SporranApp.',
  [MiniKitInstallErrorCodes.NotOnClient]: 'Window object is not available.',
  [MiniKitInstallErrorCodes.AppOutOfDate]:
    'SporranApp is out of date. Please update the app.',
};