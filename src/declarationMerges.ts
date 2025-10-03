declare global {
  interface Uint8ArrayConstructor {
    fromBase64(base64: string): Uint8Array;
  }
}

export {};
