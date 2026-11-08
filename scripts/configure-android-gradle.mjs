import fs from "node:fs";
import path from "node:path";

const propertiesPath = path.resolve("android/gradle/wrapper/gradle-wrapper.properties");
if (!fs.existsSync(propertiesPath)) {
  throw new Error("Generated Gradle wrapper properties were not found: " + propertiesPath);
}

let properties = fs.readFileSync(propertiesPath, "utf8");
const distributionMatch = properties.match(/^distributionUrl=(.+)$/m);
if (!distributionMatch) throw new Error("Gradle wrapper has no distributionUrl.");

const generatedUrl = distributionMatch[1].replace(/\\:/g, ":");
if (!/^https:\/\/services\.gradle\.org\/distributions\/gradle-8\.11\.1-(all|bin)\.zip$/.test(generatedUrl)) {
  throw new Error("Unexpected Capacitor Gradle wrapper URL; review toolchain before changing it: " + generatedUrl);
}

// The official Gradle redirect currently returns HTTP 504 in GitHub Actions.
// Use the established Aliyun Gradle mirror, but pin the SHA-256 published by
// Gradle itself. A mirror response with different bytes is rejected by Wrapper.
const runtimeUrl = "https://mirrors.aliyun.com/gradle/distributions/v8.11.1/gradle-8.11.1-bin.zip";
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
console.log("Gradle wrapper verified: Gradle 8.11.1 mirror URL, official Gradle SHA-256, 120s timeout, 3 retries.");
