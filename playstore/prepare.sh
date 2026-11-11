#!/usr/bin/env bash
# Menyiapkan build Play Store (.aab) di GitHub Actions.
# File di repository TIDAK diubah permanen — perubahan hanya terjadi di mesin build GitHub.
set -euo pipefail
cd "$(dirname "$0")/.."
VC="${1:?versionCode wajib}"
APP=android/app
SRC=$APP/src/main/java/id/alhuda/mobile

# 1) Target Android 16 (API 36) sesuai syarat Google Play + versionCode baru
sed -i -E "s/compileSdk [0-9]+/compileSdk 36/; s/targetSdk [0-9]+/targetSdk 36/; s/versionCode [0-9]+/versionCode ${VC}/" $APP/build.gradle
grep -q "suppressUnsupportedCompileSdk" android/gradle.properties || echo "android.suppressUnsupportedCompileSdk=36" >> android/gradle.properties

# 2) Tampilan edge-to-edge (wajib sejak Android 15)
cp playstore/PlayInsets.kt $SRC/PlayInsets.kt
python3 - "$SRC/MainActivity.kt" <<'PY'
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
a = "setContentView(web)"
b = "window.statusBarColor = Color.parseColor(hex.trim())"
assert s.count(a) == 1, "setContentView(web) tidak ditemukan"
assert s.count(b) == 1, "setStatusColor tidak ditemukan"
s = s.replace(a, "setContentView(PlayInsets.wrap(this, web))")
s = s.replace(b, "PlayInsets.setTopColor(Color.parseColor(hex.trim()))")
open(p, 'w', encoding='utf-8').write(s)
print("MainActivity disiapkan untuk edge-to-edge")
PY

# 3) Tanda tangan rilis dari GitHub Secrets
cat >> $APP/build.gradle <<'GRADLE'

android {
    signingConfigs {
        play {
            storeFile file(System.getenv("ALHUDA_KS_FILE"))
            storePassword System.getenv("ALHUDA_KS_PASSWORD")
            keyAlias System.getenv("ALHUDA_KEY_ALIAS")
            keyPassword System.getenv("ALHUDA_KEY_PASSWORD")
        }
    }
    buildTypes { release { signingConfig signingConfigs.play } }
    lint { checkReleaseBuilds false }
}
GRADLE

# 4) Tampilan terbaru ikut dibundel
mkdir -p $APP/src/main/assets && cp apps-script/Index.html $APP/src/main/assets/index.html
echo "Siap: targetSdk 36, versionCode ${VC}"
