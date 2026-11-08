import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nocturne.app",
  appName: "Nocturne",
  webDir: "dist",
  android: {
    // The bundled studio is local; loopback HTTP is used only for the Termux bridge.
    androidScheme: "http",
  },
};

export default config;
