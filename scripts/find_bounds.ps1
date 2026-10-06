Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("c:\Users\prath\Desktop\CODE\GymTracker\assets\images\Prava Track Progress Logo.png")

# Background is white (R > 250, G > 250, B > 250) or transparent (A == 0)
$minX = $img.Width; $minY = $img.Height; $maxX = 0; $maxY = 0

# P mark is in upper half (Y < 550)
for ($y = 0; $y -lt 550; $y++) {
    for ($x = 0; $x -lt $img.Width; $x++) {
        $p = $img.GetPixel($x, $y)
        # Check if non-white and non-transparent
        if ($p.A -gt 20 -and ($p.R -lt 245 -or $p.G -lt 245 -or $p.B -lt 245)) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "P Mark Bounding Box:" $minX $minY ($maxX - $minX + 1) ($maxY - $minY + 1)

# Now check full logo bounds (P mark + PRAVA text + TRACK YOUR PROGRESS)
$fMinX = $img.Width; $fMinY = $img.Height; $fMaxX = 0; $fMaxY = 0
for ($y = 0; $y -lt $img.Height; $y++) {
    for ($x = 0; $x -lt $img.Width; $x++) {
        $p = $img.GetPixel($x, $y)
        if ($p.A -gt 20 -and ($p.R -lt 245 -or $p.G -lt 245 -or $p.B -lt 245)) {
            if ($x -lt $fMinX) { $fMinX = $x }
            if ($x -gt $fMaxX) { $fMaxX = $x }
            if ($y -lt $fMinY) { $fMinY = $y }
            if ($y -gt $fMaxY) { $fMaxY = $y }
        }
    }
}
Write-Host "Full Logo Bounding Box:" $fMinX $fMinY ($fMaxX - $fMinX + 1) ($fMaxY - $fMinY + 1)

$img.Dispose()
