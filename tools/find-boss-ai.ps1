$f = 'D:\project\Pokemon\terraria-clock-preview\terraria-glowxel-1456\_src_1456\Terraria\NPC.cs'
$lines = Get-Content $f
$ids = @(13, 14, 15, 35, 36, 127, 134, 135, 136, 245, 246, 247, 422, 493, 507, 517)

foreach ($id in $ids) {
    # 在 SetDefaults 区域找 case，要求紧跟着 aiStyle = N 行
    for ($i = 8500; $i -lt 17500; $i++) {
        $line = $lines[$i]
        if ($line -match "^\s*case\s+${id}\s*:\s*$") {
            # 往后扫 50 行，找第一个 aiStyle = 数字
            for ($j = $i + 1; $j -lt [Math]::Min($i + 50, $lines.Length); $j++) {
                if ($lines[$j] -match 'aiStyle\s*=\s*(\d+)') {
                    Write-Output ("ID {0,3} -> aiStyle = {1}  (case@line {2})" -f $id, $matches[1], ($i + 1))
                    break
                }
                if ($lines[$j] -match '^\s*case\s+\d+') { break }
                if ($lines[$j] -match '^\s*break;') { break }
            }
            break
        }
    }
}
