export const sendWebviewEvent = <
  T extends Record<string, any> = Record<string, any>,
>(
  payload: T,
) => {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage?.(JSON.stringify(payload));
  } else if (window.webkit) {
    window.webkit?.messageHandlers?.minikit?.postMessage?.(JSON.stringify(payload));
  } else if (window.Android) {
    window.Android.postMessage?.(JSON.stringify(payload));
  }else{
    alert("No supported environment found.");
  }
};

export function callParentFunction(payload: string) {
  if (window.ReactNativeWebView) {
    alert(`sending via webview bridge payload: ${JSON.stringify(payload)}`);
    window.ReactNativeWebView.postMessage?.(payload);
  } else if (window.webkit) {
    alert("Sending via iOS webkit");
    window.webkit?.messageHandlers?.minikit?.postMessage?.(payload);
  } else if (window.Android) {
    alert("Sending via Android bridge");
    window.Android.postMessage?.(JSON.stringify(payload));
  } else {
    alert("No supported environment found.");
  }
}