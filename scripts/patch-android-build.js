const fs = require('fs');
const path = require('path');

const gradlePath = path.join(__dirname, '..', 'android', 'build.gradle');
if (fs.existsSync(gradlePath)) {
  let content = fs.readFileSync(gradlePath, 'utf8');

  // Replace untyped kotlin-gradle-plugin with fixed 1.9.25
  content = content.replace(
    "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')",
    "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.25')"
  );

  // Append compiler argument override for Compose
  const composeFix = `
allprojects {
    tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
        kotlinOptions {
            freeCompilerArgs += [
                "-P",
                "plugin:androidx.compose.compiler.plugins.kotlin:suppressKotlinVersionCompatibilityCheck=true"
            ]
        }
    }
}
`;
  content += composeFix;
  fs.writeFileSync(gradlePath, content, 'utf8');
  console.log('Successfully patched android/build.gradle');
} else {
  console.error('android/build.gradle not found');
  process.exit(1);
}
