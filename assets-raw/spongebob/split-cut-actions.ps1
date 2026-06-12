$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$cutsDir = Join-Path $scriptDir "cuts"
$targets = @(
  @{ Name = "spongebob"; Source = "spongebob"; Output = "spongebob-frames"; Skip = @("spongebob.png") },
  @{ Name = "patrick"; Source = "patrick"; Output = "patrick-frames"; Skip = @("patrick.png") }
)

function Get-ColorKey($color) {
  return "{0},{1},{2}" -f $color.R, $color.G, $color.B
}

function Get-BackgroundColor($bitmap) {
  $samples = @(
    @{ X = 0; Y = 0 },
    @{ X = $bitmap.Width - 1; Y = 0 },
    @{ X = 0; Y = $bitmap.Height - 1 },
    @{ X = $bitmap.Width - 1; Y = $bitmap.Height - 1 },
    @{ X = [Math]::Floor($bitmap.Width / 2); Y = 0 },
    @{ X = [Math]::Floor($bitmap.Width / 2); Y = $bitmap.Height - 1 }
  )

  $counts = @{}
  foreach ($sample in $samples) {
    $color = $bitmap.GetPixel($sample.X, $sample.Y)
    $key = Get-ColorKey $color
    if ($counts.ContainsKey($key)) {
      $counts[$key].Count += 1
    } else {
      $counts[$key] = [PSCustomObject]@{
        Count = 1
        Color = $color
      }
    }
  }

  return ($counts.GetEnumerator() | Sort-Object { $_.Value.Count } -Descending | Select-Object -First 1).Value.Color
}

function Is-BackgroundPixel($color, $bgColor) {
  if ($color.A -eq 0) {
    return $true
  }

  return (
    [Math]::Abs($color.R - $bgColor.R) -le 8 -and
    [Math]::Abs($color.G - $bgColor.G) -le 8 -and
    [Math]::Abs($color.B - $bgColor.B) -le 8
  )
}

function Expand-OccupiedColumns([bool[]]$occupied, [int]$maxGap) {
  $expanded = [bool[]]::new($occupied.Length)
  for ($i = 0; $i -lt $occupied.Length; $i++) {
    $expanded[$i] = $occupied[$i]
  }

  $i = 0
  while ($i -lt $expanded.Length) {
    if ($expanded[$i]) {
      $i += 1
      continue
    }

    $start = $i
    while ($i -lt $expanded.Length -and -not $expanded[$i]) {
      $i += 1
    }
    $end = $i - 1
    $gapLength = $end - $start + 1
    $hasLeft = $start -gt 0 -and $expanded[$start - 1]
    $hasRight = $i -lt $expanded.Length -and $expanded[$i]

    if ($hasLeft -and $hasRight -and $gapLength -le $maxGap) {
      for ($fill = $start; $fill -le $end; $fill++) {
        $expanded[$fill] = $true
      }
    }
  }

  return $expanded
}

function Get-ColumnSegments([bool[]]$occupied) {
  $segments = New-Object System.Collections.Generic.List[object]
  $x = 0
  while ($x -lt $occupied.Length) {
    if (-not $occupied[$x]) {
      $x += 1
      continue
    }

    $left = $x
    while ($x -lt $occupied.Length -and $occupied[$x]) {
      $x += 1
    }
    $right = $x - 1

    $segments.Add([PSCustomObject]@{
      Left = $left
      Right = $right
    })
  }

  return $segments
}

function Save-SegmentFrame($bitmap, $bgColor, $segment, $outputPath) {
  $minY = $bitmap.Height
  $maxY = -1
  $foregroundCount = 0

  for ($y = 0; $y -lt $bitmap.Height; $y++) {
    for ($x = $segment.Left; $x -le $segment.Right; $x++) {
      $color = $bitmap.GetPixel($x, $y)
      if (Is-BackgroundPixel $color $bgColor) {
        continue
      }
      $foregroundCount += 1
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }

  if ($foregroundCount -lt 40 -or $maxY -lt $minY) {
    return $null
  }

  $pad = 1
  $cropLeft = [Math]::Max(0, $segment.Left - $pad)
  $cropTop = [Math]::Max(0, $minY - $pad)
  $cropRight = [Math]::Min($bitmap.Width - 1, $segment.Right + $pad)
  $cropBottom = [Math]::Min($bitmap.Height - 1, $maxY + $pad)
  $cropWidth = $cropRight - $cropLeft + 1
  $cropHeight = $cropBottom - $cropTop + 1

  $outBitmap = New-Object System.Drawing.Bitmap($cropWidth, $cropHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  try {
    for ($y = 0; $y -lt $cropHeight; $y++) {
      for ($x = 0; $x -lt $cropWidth; $x++) {
        $sourceColor = $bitmap.GetPixel($cropLeft + $x, $cropTop + $y)
        if (Is-BackgroundPixel $sourceColor $bgColor) {
          $outBitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
          $outBitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $sourceColor.R, $sourceColor.G, $sourceColor.B))
        }
      }
    }

    $outBitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $outBitmap.Dispose()
  }

  return [PSCustomObject]@{
    Output = $outputPath
    Width = $cropWidth
    Height = $cropHeight
    ForegroundCount = $foregroundCount
  }
}

$report = New-Object System.Collections.ArrayList

foreach ($target in $targets) {
  $sourceDir = Join-Path $cutsDir $target.Source
  $outputDir = Join-Path $cutsDir $target.Output
  New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

  $skipSet = @{}
  foreach ($skipName in $target.Skip) {
    $skipSet[$skipName.ToLowerInvariant()] = $true
  }

  $files = Get-ChildItem -Path $sourceDir -File -Filter *.png | Sort-Object Name
  foreach ($file in $files) {
    if ($skipSet.ContainsKey($file.Name.ToLowerInvariant())) {
      continue
    }

    $actionName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    $actionOutDir = Join-Path $outputDir $actionName
    New-Item -ItemType Directory -Force -Path $actionOutDir | Out-Null

    $bitmap = [System.Drawing.Bitmap]::FromFile($file.FullName)
    try {
      $bgColor = Get-BackgroundColor $bitmap
      $occupied = [bool[]]::new($bitmap.Width)

      for ($x = 0; $x -lt $bitmap.Width; $x++) {
        $hasForeground = $false
        for ($y = 0; $y -lt $bitmap.Height; $y++) {
          if (-not (Is-BackgroundPixel ($bitmap.GetPixel($x, $y)) $bgColor)) {
            $hasForeground = $true
            break
          }
        }
        $occupied[$x] = $hasForeground
      }

      $expanded = Expand-OccupiedColumns $occupied 1
      $segments = Get-ColumnSegments $expanded
      $frameInfos = New-Object System.Collections.ArrayList
      $frameIndex = 1

      foreach ($segment in $segments) {
        $framePath = Join-Path $actionOutDir ("{0:D2}.png" -f $frameIndex)
        $saved = Save-SegmentFrame $bitmap $bgColor $segment $framePath
        if ($null -eq $saved) {
          continue
        }
        [void]$frameInfos.Add([PSCustomObject]@{
          Index = $frameIndex
          Width = $saved.Width
          Height = $saved.Height
          File = [System.IO.Path]::GetFileName($framePath)
        })
        $frameIndex += 1
      }

      [void]$report.Add([PSCustomObject]@{
        Character = $target.Name
        Action = $actionName
        FrameCount = $frameInfos.Count
        Frames = @($frameInfos)
      })

      Write-Output ("{0}/{1}: {2} frames" -f $target.Name, $actionName, $frameInfos.Count)
    } finally {
      $bitmap.Dispose()
    }
  }
}

$reportPath = Join-Path $scriptDir "cuts/split-report.json"
$reportJson = $report | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($reportPath, $reportJson + [Environment]::NewLine)
Write-Output ("report: {0}" -f $reportPath)
