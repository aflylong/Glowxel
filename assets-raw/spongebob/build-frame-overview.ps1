$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$cutsDir = Join-Path $scriptDir "cuts"
$outputDir = Join-Path $scriptDir "preview-64"
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$targets = @(
  @{
    Name = "spongebob"
    Source = "spongebob-frames-refined"
    Output = "spongebob-frames-overview.png"
    Title = "SpongeBob Refined Frames"
    Skip = @("windows")
  },
  @{
    Name = "patrick"
    Source = "patrick-frames-refined"
    Output = "patrick-frames-overview.png"
    Title = "Patrick Refined Frames"
    Skip = @("windows")
  }
)

$cellWidth = 74
$cellHeight = 86
$labelHeight = 16
$sectionTitleHeight = 22
$sectionGap = 16
$padding = 12
$columns = 6
$bgColor = [System.Drawing.Color]::FromArgb(255, 12, 18, 28)
$panelColor = [System.Drawing.Color]::FromArgb(255, 20, 30, 45)
$lineColor = [System.Drawing.Color]::FromArgb(255, 48, 72, 102)
$textColor = [System.Drawing.Color]::FromArgb(255, 238, 245, 255)
$mutedColor = [System.Drawing.Color]::FromArgb(255, 160, 184, 212)

function Get-ActionDirectories($baseDir, $skipNames) {
  $skipSet = @{}
  foreach ($name in $skipNames) {
    $skipSet[$name.ToLowerInvariant()] = $true
  }

  return @(
    Get-ChildItem -Path $baseDir -Directory |
      Where-Object { -not $skipSet.ContainsKey($_.Name.ToLowerInvariant()) } |
      Sort-Object Name
  )
}

function Measure-SectionHeight($frameCount) {
  $rows = [Math]::Ceiling($frameCount / $columns)
  return $sectionTitleHeight + ($rows * $cellHeight) + $labelHeight + $sectionGap
}

function Draw-StringSafe($graphics, $text, $font, $brush, $x, $y) {
  $graphics.DrawString($text, $font, $brush, [float]$x, [float]$y)
}

foreach ($target in $targets) {
  $sourceDir = Join-Path $cutsDir $target.Source
  $actions = Get-ActionDirectories $sourceDir $target.Skip
  if ($actions.Count -eq 0) {
    Write-Output ("skip {0}: no actions" -f $target.Name)
    continue
  }

  $contentWidth = ($columns * $cellWidth) + (($columns - 1) * 8)
  $canvasWidth = ($padding * 2) + $contentWidth
  $canvasHeight = $padding + 28

  $actionEntries = New-Object System.Collections.ArrayList
  foreach ($action in $actions) {
    $frames = @(Get-ChildItem -Path $action.FullName -File -Filter *.png | Sort-Object Name)
    [void]$actionEntries.Add([PSCustomObject]@{
      Name = $action.Name
      Frames = $frames
    })
    $canvasHeight += Measure-SectionHeight $frames.Count
  }

  $canvasHeight += $padding
  $bitmap = New-Object System.Drawing.Bitmap($canvasWidth, $canvasHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

  try {
    $graphics.Clear($bgColor)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $titleFont = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Bold)
    $sectionFont = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    $labelFont = New-Object System.Drawing.Font("Consolas", 8.5, [System.Drawing.FontStyle]::Regular)
    $titleBrush = New-Object System.Drawing.SolidBrush($textColor)
    $mutedBrush = New-Object System.Drawing.SolidBrush($mutedColor)
    $panelBrush = New-Object System.Drawing.SolidBrush($panelColor)
    $linePen = New-Object System.Drawing.Pen($lineColor, 1)

    Draw-StringSafe $graphics $target.Title $titleFont $titleBrush $padding 8
    Draw-StringSafe $graphics "windows excluded for now" $labelFont $mutedBrush ($padding + 240) 12

    $y = $padding + 28
    foreach ($entry in $actionEntries) {
      Draw-StringSafe $graphics ("{0}  ({1} frames)" -f $entry.Name, $entry.Frames.Count) $sectionFont $titleBrush $padding $y
      $y += $sectionTitleHeight

      for ($i = 0; $i -lt $entry.Frames.Count; $i++) {
        $frame = $entry.Frames[$i]
        $col = $i % $columns
        $row = [Math]::Floor($i / $columns)
        $cellX = $padding + ($col * ($cellWidth + 8))
        $cellY = $y + ($row * $cellHeight)

        $graphics.FillRectangle($panelBrush, $cellX, $cellY, $cellWidth, $cellHeight - $labelHeight)
        $graphics.DrawRectangle($linePen, $cellX, $cellY, $cellWidth, $cellHeight - $labelHeight)

        $image = [System.Drawing.Image]::FromFile($frame.FullName)
        try {
          $fitW = $cellWidth - 8
          $fitH = ($cellHeight - $labelHeight) - 8
          $scale = [Math]::Min($fitW / $image.Width, $fitH / $image.Height)
          $drawW = [Math]::Max(1, [Math]::Round($image.Width * $scale))
          $drawH = [Math]::Max(1, [Math]::Round($image.Height * $scale))
          $drawX = $cellX + [Math]::Floor(($cellWidth - $drawW) / 2)
          $drawY = $cellY + [Math]::Floor((($cellHeight - $labelHeight) - $drawH) / 2)
          $graphics.DrawImage($image, $drawX, $drawY, $drawW, $drawH)
        } finally {
          $image.Dispose()
        }

        Draw-StringSafe $graphics $frame.BaseName $labelFont $mutedBrush ($cellX + 2) ($cellY + $cellHeight - $labelHeight + 1)
      }

      $rows = [Math]::Ceiling($entry.Frames.Count / $columns)
      $y += ($rows * $cellHeight) + $labelHeight + $sectionGap
    }

    $outputPath = Join-Path $outputDir $target.Output
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output ("generated: {0}" -f $outputPath)
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}
