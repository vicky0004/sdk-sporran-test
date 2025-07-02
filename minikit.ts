import { sendWebviewEvent } from './utils/send-event';
import { ResponseEvent, type EventHandler, type EventPayload, type MiniAppPaymentPayload , type MiniAppInitPayload} from './types/responses';
import { type User, type DeviceProperties } from "./types/init";
import { Command, type PayCommandPayload, type PayCommandInput } from './types/commands';
import { type CommandReturnPayload, type AsyncHandlerReturn } from './types/commands';
import { type MiniKitInstallReturnType, type WebViewBasePayload } from './types/commands';
import { MiniKitInstallErrorCodes, MiniKitInstallErrorMessage } from './types/errors';
import { Network } from './types/payments';
import { validatePaymentPayload } from './validation/validation';

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        minikit?: {
          postMessage?: (payload: string) => void;
        };
      };
    };
    Android?: {
      postMessage?: (payload: string) => void;
    };
    ReactNativeWebView?: {
      postMessage?: (payload: string) => void;
    };
    SporranApp?: {
      device_os: string;
      version: number;
      is_optional_analytics?: boolean;
      supported_commands?: string[];
      safe_area_insets?: {
        top: number;
        bottom: number;
        left: number;
        right: number;
      };
    };
    MiniKit?: MiniKit;
  }
}

export const sendMiniKitEvent = <T extends WebViewBasePayload = WebViewBasePayload>(
  payload: T,
): void => {
  try {
    sendWebviewEvent(payload);
  } catch (error) {
    console.error('Failed to send MiniKit event:', error);
    throw error;
  }
};

export class MiniKit {
  private static readonly MINIKIT_VERSION = "1";
  private static readonly MINIKIT_MINOR_VERSION = "1";
  private static readonly COMMAND_TIMEOUT = 600000; // 10 mins


  private static listeners: Map<ResponseEvent, EventHandler> = new Map();
  
  public static appId: string | null = null;
  public static user: User = {};
  public static deviceProperties: DeviceProperties = {};
  private static isReady: boolean = false;

  private static async sendInit(appId: string): Promise<MiniAppInitPayload> {
    const result = await this.awaitCommand(
      ResponseEvent.Init,
      Command.init,
      () => {
        sendWebviewEvent({
          command: 'init',
          payload: {
            appid: appId,
            version: this.MINIKIT_VERSION,
            minorVersion: this.MINIKIT_MINOR_VERSION,
          },
        });
        return null;
      },
    );
    return result.finalPayload; // return payload to check status
  }

  public static subscribe<E extends ResponseEvent>(
    event: E,
    handler: EventHandler<E>,
  ): void {
    if (!handler || typeof handler !== 'function') {
      throw new Error('Event handler must be a function');
    }
    this.listeners.set(event, handler);
  }

  public static unsubscribe(event: ResponseEvent): boolean {
    return this.listeners.delete(event);
  }

  public static trigger(event: ResponseEvent, payload: EventPayload): void {
    const handler = this.listeners.get(event);
    if (!handler) {
      console.warn(`No handler registered for event: ${event}`);
      return;
    }

    try {
      handler(payload);
    } catch (error) {
      console.error(`Error in event handler for ${event}:`, error);
    }
  }

  private static async awaitCommand<
    E extends ResponseEvent,
    C extends Command,
    T extends EventPayload<E>,
  >(
    event: E,
    command: C,
    executor: () => CommandReturnPayload<C> | null,
  ): AsyncHandlerReturn<CommandReturnPayload<C> | null, T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.unsubscribe(event);
        reject(new Error(`Command ${command} timed out after ${this.COMMAND_TIMEOUT}ms`));
      }, this.COMMAND_TIMEOUT);

      let commandPayload: CommandReturnPayload<C> | null = null;
      
      const handleAndUnsubscribe = (payload: EventPayload<E>) => {
        clearTimeout(timeoutId);
        this.unsubscribe(event);
        resolve({ commandPayload, finalPayload: payload as T });
      };

      try {
        this.subscribe(event, handleAndUnsubscribe);
        commandPayload = executor();
      } catch (error) {
        clearTimeout(timeoutId);
        this.unsubscribe(event);
        reject(error);
      }
    });
  }

  public static async install(appId: string): Promise<MiniKitInstallReturnType> {
    // Check if already installed
    if (typeof window === 'undefined' || Boolean(window.MiniKit)) {
      return {
        success: false,
        errorCode: MiniKitInstallErrorCodes.AlreadyInstalled,
        errorMessage: MiniKitInstallErrorMessage[MiniKitInstallErrorCodes.AlreadyInstalled],
      };
    }

    // Validate environment
    if (!window.SporranApp) {
      return {
        success: false,
        errorCode: MiniKitInstallErrorCodes.OutsideOfSporranApp,
        errorMessage: MiniKitInstallErrorMessage[MiniKitInstallErrorCodes.OutsideOfSporranApp],
      };
    }

    // Set app ID with validation
    if (appId) {
      if (typeof appId !== 'string' || appId.trim().length === 0) {
        console.warn('Invalid app ID provided during install');
      } else {
        MiniKit.appId = appId.trim();
      }
    } else {
      console.warn('App ID not provided during install');
    }

    try {
      // Initialize user properties
      MiniKit.user = {
        optedIntoOptionalAnalytics: window.SporranApp.is_optional_analytics ?? false,
      };

      // Initialize device properties
      MiniKit.deviceProperties = {
        safeAreaInsets: window.SporranApp.safe_area_insets ?? {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
        deviceOS: window.SporranApp.device_os ?? 'unknown',
        SporranAppVersion: window.SporranApp.version ?? 0,
      };
      window.MiniKit = MiniKit;
      const initResult = await this.sendInit(appId);
      if (initResult?.status !== 'success') {
        console.error('Init failed:', initResult);
        return {
          success: false,
          errorCode: MiniKitInstallErrorCodes.Unknown,
          errorMessage: 'MiniKit initialization failed with status: ' + initResult?.status,
        };
      }

      MiniKit.isReady = true;
      return { success: true, initResult: initResult };
    } catch (error) {
      alert(error);
      return {
        success: false,
        errorCode: MiniKitInstallErrorCodes.Unknown,
        errorMessage: MiniKitInstallErrorMessage[MiniKitInstallErrorCodes.Unknown],
      };
    }
  }

  public static isInstalled(): boolean {

    let isInstalled = MiniKit.isReady;
    if (!isInstalled) {
      console.error("MiniKit is not installed. Make sure you're running inside Sporran App");
    }
    if (typeof window === 'undefined') {
      isInstalled = false;
      console.error("'pay' command unavailable: window not defined");
      return isInstalled;
    }
    return isInstalled;
  }

  public static commands = {
    pay: (payload: PayCommandInput): PayCommandPayload | null => {

      // Validate payload
      if (!validatePaymentPayload(payload)) {
        console.error("'pay' command failed: invalid payload");
        return null;
      }

      const eventPayload: PayCommandPayload = {
        ...payload,
        network: Network.Kilt,
      };

      try {
        sendMiniKitEvent<WebViewBasePayload>({
          command: Command.Pay,
          payload: eventPayload,
        });
        return eventPayload;
      } catch (error) {
        console.error("'pay' command failed:", error);
        return null;
      }
    },
  };

  public static commandsAsync = {
    pay: async (
      payload: PayCommandInput,
    ): AsyncHandlerReturn<PayCommandPayload | null, MiniAppPaymentPayload> => {
      if (!MiniKit.isInstalled()) {
        console.error("'pay' command unavailable: MiniKit not installed");
        return Promise.reject(new Error('MiniKit not installed'));
      }

      try {
        return await MiniKit.awaitCommand(
          ResponseEvent.MiniAppPayment,
          Command.Pay,
          () => this.commands.pay(payload),
        );
      } catch (error) {
        console.error('Async pay command failed:', error);
        throw error;
      }
    },
  };

  // Cleanup method for proper resource management this is for testing purposes
  public static cleanup(): void {
    this.listeners.clear();
    this.isReady = false;
    this.appId = null;
    this.user = {};
    this.deviceProperties = {};
    
    if (typeof window !== 'undefined' && window.MiniKit) {
      delete window.MiniKit;
    }
  }
}