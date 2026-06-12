$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$cutsDir = Join-Path $scriptDir "cuts"
$reportPath = Join-Path $cutsDir "split-report-refined.json"

$targets = @(
  @{
    Name = "spongebob"
    Source = "spongebob"
    Output = "spongebob-frames-refined"
    Frames = @{
      "attack" = 2
      "beingdumb" = 3
      "buttstomp" = 2
      "cheering" = 4
      "dance" = 5
      "dance3" = 6
      "dance4" = 8
      "dance5" = 7
      "fail" = 3
      "jump" = 4
      "ldle" = 5
      "miss" = 2
      "sleeping" = 7
      "walk" = 6
      "windows" = 5
    }
    Skip = @("spongebob.png")
  },
  @{
    Name = "patrick"
    Source = "patrick"
    Output = "patrick-frames-refined"
    Frames = @{
      "attack" = 4
      "beingdumb" = 3
      "buttstomp" = 2
      "cheering" = 3
      "dance1" = 4
      "dance2" = 4
      "dance3" = 6
      "dance4" = 3
      "dance5" = 3
      "dance6" = 4
      "drink" = 8
      "fail" = 3
      "jump" = 4
      "ldle" = 5
      "miss" = 2
      "scared" = 2
      "sleeping" = 5
      "walk" = 6
      "windows" = 5
    }
    Skip = @("patrick.png")
  }
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

function Test-IsBackgroundPixel($color, $bgColor) {
  if ($color.A -eq 0) {
    return $true
  }

  return (
    [Math]::Abs($color.R - $bgColor.R) -le 8 -and
    [Math]::Abs($color.G - $bgColor.G) -le 8 -and
    [Math]::Abs($color.B - $bgColor.B) -le 8
  )
}

function Get-ConnectedComponents($bitmap, $bgColor) {
  $width = $bitmap.Width
  $height = $bitmap.Height
  $visited = New-Object 'bool[,]' $width, $height
  $components = New-Object System.Collections.ArrayList

  for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
      if ($visited[$x, $y]) {
        continue
      }

      $visited[$x, $y] = $true
      $startColor = $bitmap.GetPixel($x, $y)
      if (Test-IsBackgroundPixel $startColor $bgColor) {
        continue
      }

      $queue = New-Object System.Collections.Queue
      $queue.Enqueue([int[]]@($x, $y))
      $pixels = New-Object System.Collections.ArrayList
      $minX = $x
      $maxX = $x
      $minY = $y
      $maxY = $y

      while ($queue.Count -gt 0) {
        $point = $queue.Dequeue()
        $px = $point[0]
        $py = $point[1]
        [void]$pixels.Add([int[]]@($px, $py))

        if ($px -lt $minX) { $minX = $px }
        if ($px -gt $maxX) { $maxX = $px }
        if ($py -lt $minY) { $minY = $py }
        if ($py -gt $maxY) { $maxY = $py }

        for ($dy = -1; $dy -le 1; $dy++) {
          for ($dx = -1; $dx -le 1; $dx++) {
            if ($dx -eq 0 -and $dy -eq 0) {
              continue
            }

            $nx = $px + $dx
            $ny = $py + $dy
            if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $width -or $ny -ge $height) {
              continue
            }

            if ($visited[$nx, $ny]) {
              continue
            }

            $visited[$nx, $ny] = $true
            $neighborColor = $bitmap.GetPixel($nx, $ny)
            if (Test-IsBackgroundPixel $neighborColor $bgColor) {
              continue
            }

            $queue.Enqueue([int[]]@($nx, $ny))
          }
        }
      }

      $area = $pixels.Count
      if ($area -lt 6) {
        continue
      }

      [void]$components.Add([PSCustomObject]@{
        Left = $minX
        Right = $maxX
        Top = $minY
        Bottom = $maxY
        Width = $maxX - $minX + 1
        Height = $maxY - $minY + 1
        Area = $area
        CenterX = ($minX + $maxX) / 2.0
        Pixels = @($pixels)
      })
    }
  }

  return @($components | Sort-Object Left, CenterX)
}

function Get-GapCuts($components, $targetFrames) {
  if ($components.Count -le 1 -or $targetFrames -le 1) {
    return @()
  }

  $gaps = New-Object System.Collections.ArrayList
  for ($i = 0; $i -lt $components.Count - 1; $i++) {
    $gap = $components[$i + 1].Left - $components[$i].Right - 1
    [void]$gaps.Add([PSCustomObject]@{
      Index = $i
      Gap = $gap
    })
  }

  $cutCount = [Math]::Min($targetFrames - 1, $gaps.Count)
  if ($cutCount -le 0) {
    return @()
  }

  return @(
    $gaps |
      Sort-Object -Property @{ Expression = "Gap"; Descending = $true }, @{ Expression = "Index"; Descending = $false } |
      Select-Object -First $cutCount |
      Sort-Object Index
  )
}

function Group-ComponentsByCuts($components, $cuts) {
  $groups = New-Object System.Collections.ArrayList
  if ($components.Count -eq 0) {
    return @()
  }

  $start = 0
  foreach ($cut in $cuts) {
    $end = $cut.Index
    $slice = @($components[$start..$end])
    [void]$groups.Add($slice)
    $start = $end + 1
  }

  if ($start -le $components.Count - 1) {
    $slice = @($components[$start..($components.Count - 1)])
    [void]$groups.Add($slice)
  }

  return @($groups)
}

function Save-FrameGroup($bitmap, $bgColor, $group, $outputPath) {
  $left = ($group | Measure-Object Left -Minimum).Minimum
  $right = ($group | Measure-Object Right -Maximum).Maximum
  $top = ($group | Measure-Object Top -Minimum).Minimum
  $bottom = ($group | Measure-Object Bottom -Maximum).Maximum

  $pad = 1
  $cropLeft = [Math]::Max(0, $left - $pad)
  $cropTop = [Math]::Max(0, $top - $pad)
  $cropRight = [Math]::Min($bitmap.Width - 1, $right + $pad)
  $cropBottom = [Math]::Min($bitmap.Height - 1, $bottom + $pad)
  $cropWidth = $cropRight - $cropLeft + 1
  $cropHeight = $cropBottom - $cropTop + 1

  $outBitmap = New-Object System.Drawing.Bitmap($cropWidth, $cropHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  try {
    for ($y = 0; $y -lt $cropHeight; $y++) {
      for ($x = 0; $x -lt $cropWidth; $x++) {
        $sourceColor = $bitmap.GetPixel($cropLeft + $x, $cropTop + $y)
        if (Test-IsBackgroundPixel $sourceColor $bgColor) {
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
    File = [System.IO.Path]::GetFileName($outputPath)
    Width = $cropWidth
    Height = $cropHeight
    Left = $cropLeft
    Right = $cropRight
    Top = $cropTop
    Bottom = $cropBottom
    ComponentCount = $group.Count
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

  foreach ($file in (Get-ChildItem -Path $sourceDir -File -Filter *.png | Sort-Object Name)) {
    if ($skipSet.ContainsKey($file.Name.ToLowerInvariant())) {
      continue
    }

    $actionName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    if (-not $target.Frames.ContainsKey($actionName)) {
      continue
    }

    $expectedFrames = [int]$target.Frames[$actionName]
    $actionOutDir = Join-Path $outputDir $actionName
    New-Item -ItemType Directory -Force -Path $actionOutDir | Out-Null
    Get-ChildItem -Path $actionOutDir -File -Filter *.png -ErrorAction SilentlyContinue | Remove-Item -Force

    $bitmap = [System.Drawing.Bitmap]::FromFile($file.FullName)
    try {
      $bgColor = Get-BackgroundColor $bitmap
      $components = @(Get-ConnectedComponents $bitmap $bgColor)
      $cuts = @(Get-GapCuts $components $expectedFrames)
      $groups = @(Group-ComponentsByCuts $components $cuts)

      $frames = New-Object System.Collections.ArrayList
      $frameIndex = 1
      foreach ($group in $groups) {
        $framePath = Join-Path $actionOutDir ("{0:D2}.png" -f $frameIndex)
        $frameInfo = Save-FrameGroup $bitmap $bgColor $group $framePath
        [void]$frames.Add($frameInfo)
        $frameIndex += 1
      }

      [void]$report.Add([PSCustomObject]@{
        Character = $target.Name
        Action = $actionName
        ExpectedFrames = $expectedFrames
        ComponentCount = $components.Count
        ActualFrames = $frames.Count
        Gaps = @($cuts | ForEach-Object { [PSCustomObject]@{ Index = $_.Index; Gap = $_.Gap } })
        Frames = @($frames)
      })

      Write-Output ("{0}/{1}: components={2} expected={3} actual={4}" -f $target.Name, $actionName, $components.Count, $expectedFrames, $frames.Count)
    } finally {
      $bitmap.Dispose()
    }
  }
}

$reportJson = $report | ConvertTo-Json -Depth 7
[System.IO.File]::WriteAllText($reportPath, $reportJson + [Environment]::NewLine)
Write-Output ("report: {0}" -f $reportPath)
