import fs from "node:fs";
import path from "node:path";

const propertiesPath = path.resolve("android/gradle/wrapper/gradle-wrapper.properties");
if (!fs.existsSync(propertiesPath)) {
  throw new Error("Generated Gradle wrapper properties were not found: " + propertiesPath);
}

let properties = fs.readFileSync(propertiesPath, "utf8");
const distributionMatch = properties.match(/^distributionUrl=(.+)$/m);
if (!distributionMatch) throw new Error("Gradle wrapper has no distributionUrl.");

const distributionUrl = distributionMatch[1].replace(/\\:/g, ":");
if (!/^https:\/\/(services|downloads)\.gradle\.org\/distributions\/gradle-[0-9][0-9A-Za-z.+-]*-(all|bin)\.zip$/.test(distributionUrl)) {
  throw new Error("Refusing unexpected or unpinned Gradle distribution URL: " + distributionUrl);
}

// Capacitor 7.4.3 generates Gradle 8.11.1. Fail closed if its template
// changes, so a toolchain upgrade must bring a reviewed official checksum.
const runtimeUrl = distributionUrl
  .replace(/^https:\/\/services\.gradle\.org\//, "https://downloads.gradle.org/")
  .replace(/-all\.zip$/, "-bin.zip");
if (!runtimeUrl.endsWith("/gradle-8.11.1-bin.zip")) {
  throw new Error("Unexpected Gradle version. Review compatibility and official SHA-256 before changing this pin: " + runtimeUrl);
}
const distributionSha256Sum = "f397b287023acdba1e9f6fc5ea72d22dd63669d59ed4a289a29b1a76eee151c6";

properties = properties.replace(
  /^distributionUrl=.*$/m,
  "distributionUrl=" + runtimeUrl.replace(/:/g, "\\:")
);

const setProperty = (key, value) => {
  const line = new RegExp("^" + key + "=.*$", "m");
  if (line.test(properties)) properties = properties.replace(line, key + "=" + value);
  else properties = properties.trimEnd() + "\n" + key + "=" + value + "\n";
};

setProperty("distributionSha256Sum", distributionSha256Sum);
setProperty("networkTimeout", "120000");
setProperty("retries", "3");
setProperty("retryBackOffMs", "1000");
setProperty("validateDistributionUrl", "true");

fs.writeFileSync(propertiesPath, properties);
const verified = fs.readFileSync(propertiesPath, "utf8");
for (const expected of [
  "distributionUrl=" + runtimeUrl.replace(/:/g, "\\:"),
  "distributionSha256Sum=" + distributionSha256Sum,
  "networkTimeout=120000",
  "retries=3",
  "retryBackOffMs=1000",
  "validateDistributionUrl=true"
]) {
  if (!verified.includes(expected)) throw new Error("Gradle wrapper configuration verification failed: " + expected);
}
console.log("Gradle wrapper verified: Gradle 8.11.1 official downloads.gradle.org HTTPS binary, official SHA-256, 120s timeout, 3 retries.");
