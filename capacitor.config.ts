import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.vlife.fitness",
  appName: "V-Life Fitness",
  webDir: "out",

  server: {
    // Load the remote web app URL
    url: "https://v-life.app",
    // Allow navigation to the app domain and Supabase
    allowNavigation: ["v-life.app", "*.v-life.app", "*.supabase.co"],
    // HTTPS only - no cleartext
    cleartext: false,
    // Error page for offline/connection issues
    errorPath: "error.html",
  },

  // iOS-specific configuration
  ios: {
    contentInset: "automatic",
    allowsLinkPreview: true,
    scrollEnabled: true,
    backgroundColor: "#000000",
    preferredContentMode: "mobile",
  },

  // Android-specific configuration
  android: {
    allowMixedContent: false,
    backgroundColor: "#000000",
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: "#000000",
      showSpinner: true,
      spinnerColor: "#F59E0B", // V-Life amber accent color
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#000000",
    },
  },
};

export default config;
