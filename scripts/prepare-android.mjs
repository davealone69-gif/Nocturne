import fs from "node:fs";
import path from "node:path";

const root = path.resolve("android/app/src/main");
const javaRoot = path.join(root, "java");
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});
const mainActivity = walk(javaRoot).find((file) => /MainActivity\.java$/.test(file));
if (!mainActivity) throw new Error("Capacitor generated MainActivity.java was not found.");
const source = fs.readFileSync(mainActivity, "utf8");
const packageName = source.match(/^package\s+([\w.]+);/m)?.[1];
if (!packageName) throw new Error("Could not determine Android application package.");
const pluginSource = fs.readFileSync("native/android/TermuxServicesPlugin.java", "utf8")
  .replace("package com.nocturne.app;", "package " + packageName + ";");
const packageDir = path.join(javaRoot, ...packageName.split("."));
fs.mkdirSync(packageDir, { recursive: true });
fs.writeFileSync(path.join(packageDir, "TermuxServicesPlugin.java"), pluginSource);

if (!source.includes("TermuxServicesPlugin.class")) {
  const patched = source.replace(/(public class MainActivity extends BridgeActivity\s*\{)/,
    "$1\n    @Override\n    public void onCreate(android.os.Bundle savedInstanceState) {\n        registerPlugin(TermuxServicesPlugin.class);\n        super.onCreate(savedInstanceState);\n    }");
  if (patched === source) throw new Error("Could not safely register TermuxServicesPlugin.");
  fs.writeFileSync(mainActivity, patched);
}

const manifest = path.join(root, "AndroidManifest.xml");
let xml = fs.readFileSync(manifest, "utf8");

const ensureBeforeApplication = (tag, description) => {
  if (xml.includes(description)) return;
  const applicationTag = xml.match(/<application\b/);
  if (!applicationTag || applicationTag.index == null) {
    throw new Error("AndroidManifest.xml has no application element; cannot add " + description);
  }
  xml = xml.slice(0, applicationTag.index) + "    " + tag + "\n    " + xml.slice(applicationTag.index);
};

ensureBeforeApplication(
  '<uses-permission android:name="android.permission.INTERNET" />',
  'android.permission.INTERNET'
);
ensureBeforeApplication(
  '<uses-permission android:name="com.termux.permission.RUN_COMMAND" />',
  'com.termux.permission.RUN_COMMAND'
);

if (!xml.includes('<package android:name="com.termux"')) {
  const manifestOpen = xml.match(/<manifest\b[^>]*>/);
  if (!manifestOpen || manifestOpen.index == null) {
    throw new Error("AndroidManifest.xml has no manifest root; cannot add Termux package visibility.");
  }
  const insertionPoint = manifestOpen.index + manifestOpen[0].length;
  xml = xml.slice(0, insertionPoint) +
    '\n    <queries><package android:name="com.termux" /></queries>' +
    xml.slice(insertionPoint);
}

const applicationOpen = xml.match(/<application\b[^>]*>/);
if (!applicationOpen || applicationOpen.index == null) {
  throw new Error("AndroidManifest.xml has no application element.");
}
if (!/\bandroid:usesCleartextTraffic\s*=/.test(applicationOpen[0])) {
  const updatedApplicationTag = applicationOpen[0].replace(
    /\s*\/>$/,
    ' android:usesCleartextTraffic="true" />'
  ).replace(
    />$/,
    ' android:usesCleartextTraffic="true">'
  );
  xml = xml.slice(0, applicationOpen.index) + updatedApplicationTag +
    xml.slice(applicationOpen.index + applicationOpen[0].length);
}

fs.writeFileSync(manifest, xml);
for (const required of [
  'android.permission.INTERNET',
  'com.termux.permission.RUN_COMMAND',
  '<package android:name="com.termux"',
  'android:usesCleartextTraffic="true"'
]) {
  if (!xml.includes(required)) throw new Error("Android manifest verification failed: " + required);
}
console.log("Android manifest verified: INTERNET, Termux RUN_COMMAND, Termux package visibility, and loopback cleartext.");
