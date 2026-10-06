Add-Type -AssemblyName System.Drawing

function Create-Resized-Icon {
    param(
        [string]$SourcePath,
        [string]$DestPath,
        [int]$TargetWidth,
        [int]$TargetHeight,
        [double]$ContentScale,
        [System.Drawing.Color]$BgColor,
        [bool]$TransparentBg
    )
    $srcImg = [System.Drawing.Image]::FromFile($SourcePath)
    $destBitmap = New-Object System.Drawing.Bitmap $TargetWidth, $TargetHeight
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($TransparentBg) {
        $graphics.Clear([System.Drawing.Color]::Transparent)
    } else {
        $graphics.Clear($BgColor)
    }

    $aspect = $srcImg.Width / $srcImg.Height
    $maxW = $TargetWidth * $ContentScale
    $maxH = $TargetHeight * $ContentScale

    if (($maxW / $aspect) -le $maxH) {
        $destW = [int]$maxW
        $destH = [int]($maxW / $aspect)
    } else {
        $destH = [int]$maxH
        $destW = [int]($maxH * $aspect)
    }

    $destX = [int](($TargetWidth - $destW) / 2)
    $destY = [int](($TargetHeight - $destH) / 2)

    $graphics.DrawImage($srcImg, $destX, $destY, $destW, $destH)
    $graphics.Dispose()
    $srcImg.Dispose()

    $destBitmap.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBitmap.Dispose()
    Write-Host "Generated: $DestPath"
}

$logo = "c:\Users\prath\Desktop\CODE\GymTracker\assets\images\logo.png"
$darkBg = [System.Drawing.ColorTranslator]::FromHtml("#0D0F11")

# 1. icon.png (1024x1024, dark background, 75% scale)
Create-Resized-Icon -SourcePath $logo -DestPath "c:\Users\prath\Desktop\CODE\GymTracker\assets\images\icon.png" -TargetWidth 1024 -TargetHeight 1024 -ContentScale 0.75 -BgColor $darkBg -TransparentBg $false

# 2. android-icon-foreground.png (512x512, transparent background, 65% scale for adaptive icon safe-zone)
Create-Resized-Icon -SourcePath $logo -DestPath "c:\Users\prath\Desktop\CODE\GymTracker\assets\images\android-icon-foreground.png" -TargetWidth 512 -TargetHeight 512 -ContentScale 0.65 -BgColor $darkBg -TransparentBg $true

# 3. favicon.png (192x192, dark background, 85% scale)
Create-Resized-Icon -SourcePath $logo -DestPath "c:\Users\prath\Desktop\CODE\GymTracker\assets\images\favicon.png" -TargetWidth 192 -TargetHeight 192 -ContentScale 0.85 -BgColor $darkBg -TransparentBg $false

# 4. splash-icon.png (512x512, dark background, 70% scale)
Create-Resized-Icon -SourcePath $logo -DestPath "c:\Users\prath\Desktop\CODE\GymTracker\assets\images\splash-icon.png" -TargetWidth 512 -TargetHeight 512 -ContentScale 0.70 -BgColor $darkBg -TransparentBg $false
