
# Setup Resources for Standalone Processing IDE
# Downloads Processing 4.3 for Windows and macOS and extracts JDK/Jars

$PROCESSING_VER = "4.3"
$BASE_URL = "https://github.com/processing/processing4/releases/download/processing-1293-$PROCESSING_VER"
$WIN_ZIP = "processing-$PROCESSING_VER-windows-x64.zip"
$MAC_ZIP = "processing-$PROCESSING_VER-macos-x64.zip"

$RESOURCES_DIR = Resolve-Path ".\resources"
$JDK_DIR = Join-Path $RESOURCES_DIR "jdk"
$PROC_LIBS_DIR = Join-Path $RESOURCES_DIR "processing"

# Ensure directories exist
New-Item -ItemType Directory -Force -Path $JDK_DIR | Out-Null
New-Item -ItemType Directory -Force -Path $PROC_LIBS_DIR | Out-Null
New-Item -ItemType Directory -Force -Path ".\temp_download" | Out-Null

Set-Location ".\temp_download"

# Function to Download
function Download-File {
    param ($FileName)
    if (Test-Path $FileName) {
        Write-Host "File $FileName already exists, skipping download."
    } else {
        Write-Host "Downloading $FileName from $BASE_URL/$FileName ..."
        Invoke-WebRequest -Uri "$BASE_URL/$FileName" -OutFile $FileName
    }
}

# 1. Windows Setup (for local verification)
Download-File $WIN_ZIP

Write-Host "Extracting Windows version..."
Expand-Archive -Path $WIN_ZIP -DestinationPath ".\win_extract" -Force

# Move JDK
# Windows zip structure: processing-4.3/java
$WinJavaSource = ".\win_extract\processing-$PROCESSING_VER\java"
$WinJavaDest = Join-Path $JDK_DIR "win"
if (Test-Path $WinJavaSource) {
    Write-Host "Setting up Windows JDK..."
    if (Test-Path $WinJavaDest) { Remove-Item -Recurse -Force $WinJavaDest }
    Move-Item -Path $WinJavaSource -Destination $WinJavaDest
} else {
    Write-Error "Windows Java folder not found in zip!"
}

# Move Core Libraries
# Only need to do this once (from Windows zip is fine)
$LbSource = ".\win_extract\processing-$PROCESSING_VER\core\library"
if (Test-Path $LbSource) {
    Write-Host "Setting up Processing Core Libraries..."
    Copy-Item -Path "$LbSource\*.jar" -Destination $PROC_LIBS_DIR
}

# 2. MacOS Setup (for cross-packaging)
Download-File $MAC_ZIP

Write-Host "Extracting macOS version..."
Expand-Archive -Path $MAC_ZIP -DestinationPath ".\mac_extract" -Force

# Move JDK
# Mac zip structure: Processing.app/Contents/PlugIns/jdk-*.jdk/Contents/Home
# We need to find where 'bin/java' is.
$MacExtractRoot = ".\mac_extract\Processing.app\Contents\PlugIns"
$JdkFolder = Get-ChildItem -Path $MacExtractRoot -Filter "jdk*" | Select-Object -First 1
if ($JdkFolder) {
    $MacJavaSource = Join-Path $JdkFolder.FullName "Contents\Home"
    $MacJavaDest = Join-Path $JDK_DIR "mac"
    
    if (Test-Path $MacJavaSource) {
        Write-Host "Setting up MacOS JDK..."
        if (Test-Path $MacJavaDest) { Remove-Item -Recurse -Force $MacJavaDest }
        Move-Item -Path $MacJavaSource -Destination $MacJavaDest
    } else {
        Write-Error "MacOS Java Home not found at $MacJavaSource"
    }
} else {
    Write-Error "Could not find JDK plugin in Mac Zip"
}

# Cleanup
Set-Location ..
Remove-Item -Recurse -Force ".\temp_download"

Write-Host "✅ Resources setup complete!"
