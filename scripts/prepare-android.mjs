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
  .replace("package com.nocturne.app;", \`package \${packageName};\`);
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
if (!xml.includes("com.termux.permission.RUN_COMMAND")) {
  xml = xml.replace("<manifest", '<manifest xmlns:tools="http://schemas.android.com/tools"');
  xml = xml.replace("<application", '<queries><package android:name="com.termux" /></queries>\n    <uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="com.termux.permission.RUN_COMMAND" />\n    <application android:usesCleartextTraffic="true"');
  fs.writeFileSync(manifest, xml);
}
console.log("Android Termux bridge registered.");
