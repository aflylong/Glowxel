param()

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$firmwareDir = Resolve-Path (Join-Path $scriptDir "..")
$repoRoot = Resolve-Path (Join-Path $firmwareDir "..")
$buildDir = Join-Path $firmwareDir ".pio\build\esp32dev"
$targetDir = Join-Path $repoRoot "website\public\firmware\esp32"
$bootApp0Path = Join-Path $env:USERPROFILE ".platformio\packages\framework-arduinoespressif32\tools\partitions\boot_app0.bin"

$files = @(
  @{
    Name = "bootloader.bin"
    Source = Join-Path $buildDir "bootloader.bin"
  },
  @{
    Name = "partitions.bin"
    Source = Join-Path $buildDir "partitions.bin"
  },
  @{
    Name = "boot_app0.bin"
    Source = $bootApp0Path
  },
  @{
    Name = "firmware.bin"
    Source = Join-Path $buildDir "firmware.bin"
  },
  @{
    Name = "littlefs.bin"
    Source = Join-Path $buildDir "littlefs.bin"
  }
)

if (-not (Test-Path -LiteralPath $targetDir)) {
  New-Item -Path $targetDir -ItemType Directory | Out-Null
}

foreach ($file in $files) {
  if (-not (Test-Path -LiteralPath $file.Source)) {
    throw "缺少 $($file.Name)：$($file.Source)。请先在 esp32-firmware 下运行 .\pio.cmd run 和 .\pio.cmd run -t buildfs。"
  }

  $sourceItem = Get-Item -LiteralPath $file.Source
  if ($sourceItem.Length -le 0) {
    throw "$($file.Name) 文件为空：$($file.Source)。请重新生成后再发布。"
  }
}

foreach ($file in $files) {
  $targetPath = Join-Path $targetDir $file.Name
  Copy-Item -LiteralPath $file.Source -Destination $targetPath -Force
  $targetItem = Get-Item -LiteralPath $targetPath
  Write-Host ("已更新 {0} ({1} bytes)" -f $file.Name, $targetItem.Length)
}

Write-Host "网页烧录发布文件已准备到：$targetDir"
