$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$cutsDir = Join-Path $scriptDir "cuts"
$outputPath = Join-Path $scriptDir "character-frame-pixels.js"

$targets = @(
  @{
    Name = "spongebob"
    Source = "spongebob-frames-refined"
    SkipActions = @("attack", "jump")
  },
  @{
    Name = "patrick"
    Source = "patrick-frames-refined"
    SkipActions = @("dance5", "jump")
  }
)

$alignmentModes = @{
  "spongebob/windows" = "right_edge_bottom"
  "patrick/attack" = "right_edge_bottom"
  "patrick/windows" = "right_edge_bottom"
}

function Get-HexColor($color) {
  return ("#{0:x2}{1:x2}{2:x2}" -f $color.R, $color.G, $color.B)
}

function Get-AlignmentMode($characterName, $actionName) {
  $key = "{0}/{1}" -f $characterName.ToLowerInvariant(), $actionName.ToLowerInvariant()
  if ($alignmentModes.ContainsKey($key)) {
    return $alignmentModes[$key]
  }
  return "body_anchor"
}

function Get-FrameMetrics($bitmap) {
  $minX = $bitmap.Width
  $minY = $bitmap.Height
  $maxX = -1
  $maxY = -1
  $opaqueCount = 0

  for ($y = 0; $y -lt $bitmap.Height; $y++) {
    for ($x = 0; $x -lt $bitmap.Width; $x++) {
      $color = $bitmap.GetPixel($x, $y)
      if ($color.A -lt 128) {
        continue
      }

      $opaqueCount += 1
      if ($x -lt $minX) { $minX = $x }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }

  if ($opaqueCount -eq 0) {
    throw "Refusing to use empty frame bitmap"
  }

  $bodyY0 = [Math]::Floor($minY + (($maxY - $minY + 1) * 0.28))
  $bodyY1 = [Math]::Floor($minY + (($maxY - $minY + 1) * 0.82))
  $centerSamples = New-Object System.Collections.ArrayList

  for ($y = $bodyY0; $y -le $bodyY1; $y++) {
    $rowXs = New-Object System.Collections.ArrayList
    for ($x = $minX; $x -le $maxX; $x++) {
      $color = $bitmap.GetPixel($x, $y)
      if ($color.A -lt 128) {
        continue
      }
      [void]$rowXs.Add($x)
    }

    if ($rowXs.Count -lt 3) {
      continue
    }

    $sortedRow = @($rowXs | Sort-Object)
    $start = [Math]::Floor($sortedRow.Count * 0.35)
    $end = [Math]::Ceiling($sortedRow.Count * 0.65)
    for ($i = $start; $i -lt $end; $i++) {
      [void]$centerSamples.Add([int]$sortedRow[$i])
    }
  }

  $anchorX = 0
  if ($centerSamples.Count -gt 0) {
    $sortedSamples = @($centerSamples | Sort-Object)
    $anchorX = [int]$sortedSamples[[Math]::Floor($sortedSamples.Count / 2)]
  } else {
    $anchorX = [int][Math]::Round(($minX + $maxX) / 2.0)
  }

  return [PSCustomObject]@{
    MinX = $minX
    MinY = $minY
    MaxX = $maxX
    MaxY = $maxY
    AnchorX = $anchorX
    FootY = $maxY
  }
}

function New-PixelBuffer($length) {
  $buffer = New-Object 'int[]' $length
  for ($i = 0; $i -lt $length; $i++) {
    $buffer[$i] = -1
  }
  return $buffer
}

function Pack-FramePixels($bitmap, $canvasWidth, $canvasHeight, $offsetX, $offsetY, $palette, $paletteIndexByColor) {
  $pixels = New-PixelBuffer ($canvasWidth * $canvasHeight)

  for ($y = 0; $y -lt $bitmap.Height; $y++) {
    for ($x = 0; $x -lt $bitmap.Width; $x++) {
      $color = $bitmap.GetPixel($x, $y)
      if ($color.A -lt 128) {
        continue
      }

      $targetX = $offsetX + $x
      $targetY = $offsetY + $y
      if ($targetX -lt 0 -or $targetY -lt 0 -or $targetX -ge $canvasWidth -or $targetY -ge $canvasHeight) {
        throw ("Packed pixel out of bounds: source={0}x{1}, target={2},{3}, canvas={4}x{5}" -f $bitmap.Width, $bitmap.Height, $targetX, $targetY, $canvasWidth, $canvasHeight)
      }

      $hex = Get-HexColor $color
      if (-not $paletteIndexByColor.ContainsKey($hex)) {
        $paletteIndexByColor[$hex] = $palette.Count
        [void]$palette.Add($hex)
      }

      $pixels[($targetY * $canvasWidth) + $targetX] = [int]$paletteIndexByColor[$hex]
    }
  }

  return $pixels
}

$palette = New-Object System.Collections.ArrayList
$paletteIndexByColor = @{}
$characters = [ordered]@{}

foreach ($target in $targets) {
  $sourceDir = Join-Path $cutsDir $target.Source
  $skipSet = @{}
  foreach ($skipName in $target.SkipActions) {
    $skipSet[$skipName.ToLowerInvariant()] = $true
  }

  $actions = @(
    Get-ChildItem -Path $sourceDir -Directory |
      Where-Object { -not $skipSet.ContainsKey($_.Name.ToLowerInvariant()) } |
      Sort-Object Name
  )

  $actionOrder = New-Object System.Collections.ArrayList
  $actionMap = [ordered]@{}

  foreach ($action in $actions) {
    $frameFiles = @(Get-ChildItem -Path $action.FullName -File -Filter *.png | Sort-Object Name)
    if ($frameFiles.Count -eq 0) {
      continue
    }

    $mode = Get-AlignmentMode $target.Name $action.Name
    $loadedFrames = New-Object System.Collections.ArrayList

    foreach ($frameFile in $frameFiles) {
      $bitmap = [System.Drawing.Bitmap]::FromFile($frameFile.FullName)
      $metrics = Get-FrameMetrics $bitmap
      [void]$loadedFrames.Add([PSCustomObject]@{
        Name = $frameFile.BaseName
        Bitmap = $bitmap
        Metrics = $metrics
      })
    }

    try {
      $canvasWidth = 0
      $canvasHeight = 0
      $targetAnchorX = 0
      $targetFootY = 0

      if ($mode -eq "top_left") {
        $canvasWidth = ($loadedFrames | ForEach-Object { $_.Bitmap.Width } | Measure-Object -Maximum).Maximum
        $canvasHeight = ($loadedFrames | ForEach-Object { $_.Bitmap.Height } | Measure-Object -Maximum).Maximum
      } elseif ($mode -eq "right_edge_bottom") {
        $canvasWidth = ($loadedFrames | ForEach-Object { $_.Bitmap.Width } | Measure-Object -Maximum).Maximum
        $canvasHeight = ($loadedFrames | ForEach-Object { $_.Bitmap.Height } | Measure-Object -Maximum).Maximum
      } else {
        $targetAnchorX = ($loadedFrames | ForEach-Object { $_.Metrics.AnchorX } | Measure-Object -Maximum).Maximum
        $targetFootY = ($loadedFrames | ForEach-Object { $_.Metrics.FootY } | Measure-Object -Maximum).Maximum
        $rightExtent = ($loadedFrames | ForEach-Object { ($_.Bitmap.Width - 1) - $_.Metrics.AnchorX } | Measure-Object -Maximum).Maximum
        $bottomExtent = ($loadedFrames | ForEach-Object { ($_.Bitmap.Height - 1) - $_.Metrics.FootY } | Measure-Object -Maximum).Maximum
        $canvasWidth = $targetAnchorX + $rightExtent + 1
        $canvasHeight = $targetFootY + $bottomExtent + 1
      }

      [void]$actionOrder.Add($action.Name)
      $frameOrder = New-Object System.Collections.ArrayList
      $frameEntries = New-Object System.Collections.ArrayList

      foreach ($frame in $loadedFrames) {
        $offsetX = 0
        $offsetY = 0

        if ($mode -eq "right_edge_bottom") {
          $offsetX = $canvasWidth - $frame.Bitmap.Width
          $offsetY = $canvasHeight - $frame.Bitmap.Height
        } elseif ($mode -ne "top_left") {
          $offsetX = $targetAnchorX - $frame.Metrics.AnchorX
          $offsetY = $targetFootY - $frame.Metrics.FootY
        }

        $packedPixels = Pack-FramePixels $frame.Bitmap $canvasWidth $canvasHeight $offsetX $offsetY $palette $paletteIndexByColor

        [void]$frameOrder.Add($frame.Name)
        [void]$frameEntries.Add([ordered]@{
          name = $frame.Name
          w = $canvasWidth
          h = $canvasHeight
          p = $packedPixels
        })
      }

      $actionMap[$action.Name] = [ordered]@{
        frameOrder = @($frameOrder)
        frames = @($frameEntries)
      }
    } finally {
      foreach ($frame in $loadedFrames) {
        $frame.Bitmap.Dispose()
      }
    }
  }

  $characters[$target.Name] = [ordered]@{
    actionOrder = @($actionOrder)
    actions = $actionMap
  }
}

$payload = [ordered]@{
  generatedAt = (Get-Date).ToString("s")
  transparent = -1
  palette = @($palette)
  characters = $characters
}

$json = $payload | ConvertTo-Json -Depth 100 -Compress
$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("// Generated by assets-raw/spongebob/build-character-frame-pixels.ps1")
$lines.Add("// Action-aligned character pixels for SpongeBob and Patrick preview")
$lines.Add("window.SPONGEBOB_CHARACTER_FRAMES = $json;")
[System.IO.File]::WriteAllLines($outputPath, $lines)

foreach ($target in $targets) {
  $character = $characters[$target.Name]
  $actionCount = $character.actionOrder.Count
  $frameTotal = 0
  foreach ($actionName in $character.actionOrder) {
    $frameTotal += $character.actions[$actionName].frames.Count
  }
  Write-Output ("{0}: actions={1} frames={2}" -f $target.Name, $actionCount, $frameTotal)
}
Write-Output ("palette={0}" -f $palette.Count)
Write-Output ("generated: {0}" -f $outputPath)
