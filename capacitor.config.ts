import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nocturne.app",
  appName: "Nocturne",
  webDir: "dist",
  // Use a local HTTP origin so Android can reach the loopback-only Termux proxy.
  server: {
    androidScheme: "http",
  },
};

export default config;
