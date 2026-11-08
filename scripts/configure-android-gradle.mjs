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
if (!/^https:\/\/services\.gradle\.org\/distributions\/gradle-[0-9][0-9A-Za-z.+-]*-(all|bin)\.zip$/.test(distributionUrl)) {
  throw new Error("Refusing unexpected or unpinned Gradle distribution URL: " + distributionUrl);
}

// Android builds need only the Gradle runtime. The -bin archive is smaller
// than -all and avoids downloading bundled documentation and sources.
const runtimeUrl = distributionUrl.replace(/-all\.zip$/, "-bin.zip");
properties = properties.replace(
  /^distributionUrl=.*$/m,
  "distributionUrl=" + runtimeUrl.replace(/:/g, "\\:")
);

const setProperty = (key, value) => {
  const line = new RegExp("^" + key + "=.*$", "m");
  if (line.test(properties)) properties = properties.replace(line, key + "=" + value);
  else properties = properties.trimEnd() + "\n" + key + "=" + value + "\n";
};

setProperty("networkTimeout", "120000");
setProperty("retries", "3");
setProperty("retryBackOffMs", "1000");
setProperty("validateDistributionUrl", "true");

fs.writeFileSync(propertiesPath, properties);
const verified = fs.readFileSync(propertiesPath, "utf8");
for (const expected of [
  "distributionUrl=" + runtimeUrl.replace(/:/g, "\\:"),
  "networkTimeout=120000",
  "retries=3",
  "retryBackOffMs=1000",
  "validateDistributionUrl=true"
]) {
  if (!verified.includes(expected)) throw new Error("Gradle wrapper configuration verification failed: " + expected);
}
console.log("Gradle wrapper verified: pinned official HTTPS distribution, runtime-only archive, 120s timeout, 3 retries.");
