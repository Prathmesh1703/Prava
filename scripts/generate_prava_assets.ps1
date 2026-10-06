Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile("c:\Users\prath\Desktop\CODE\GymTracker\assets\images\Prava Track Progress Logo.png")

# Bounding box of P mark: 599, 101, 662, 449
$cropX = 599
$cropY = 101
$cropW = 662
$cropH = 449

$rect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
# Perfectly preserve the native 32-bit transparent ARGB channels!
$pBitmap = $src.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Save logo.png (clean transparent high-res P mark)
$pBitmap.Save("c:\Users\prath\Desktop\CODE\GymTracker\assets\images\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved assets/images/logo.png ($cropW x $cropH)"

function Generate-Padded-Icon {
    param(
        [System.Drawing.Bitmap]$sourceImg,
        [string]$destPath,
        [int]$targetWidth,
        [int]$targetHeight,
        [double]$scale,
        [System.Drawing.Color]$bgColor,
        [bool]$isTransparent
    )

    $destBmp = New-Object System.Drawing.Bitmap $targetWidth, $targetHeight, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($isTransparent) {
        $g.Clear([System.Drawing.Color]::Transparent)
    } else {
        $g.Clear($bgColor)
    }

    $aspect = $sourceImg.Width / $sourceImg.Height
    $maxW = $targetWidth * $scale
    $maxH = $targetHeight * $scale

    if (($maxW / $aspect) -le $maxH) {
        $destW = [int]$maxW
        $destH = [int]($maxW / $aspect)
    } else {
        $destH = [int]$maxH
        $destW = [int]($maxH * $aspect)
    }

    $destX = [int](($targetWidth - $destW) / 2)
    $destY = [int](($targetHeight - $destH) / 2)

    $g.DrawImage($sourceImg, $destX, $destY, $destW, $destH)
    $g.Dispose()

    $destBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
    Write-Host "Generated: $destPath"
}

$darkBrandColor = [System.Drawing.ColorTranslator]::FromHtml("#1B0F0F")

# 1. icon.png (1024x1024, #1B0F0F background, 72% scale)
Generate-Padded-Icon -sourceImg $pBitmap -destPath "c:\Users\prath\Desktop\CODE\GymTracker\assets\images\icon.png" -targetWidth 1024 -targetHeight 1024 -scale 0.72 -bgColor $darkBrandColor -isTransparent $false

# 2. android-icon-foreground.png (512x512, transparent, 64% scale for Android adaptive icon safe zone)
Generate-Padded-Icon -sourceImg $pBitmap -destPath "c:\Users\prath\Desktop\CODE\GymTracker\assets\images\android-icon-foreground.png" -targetWidth 512 -targetHeight 512 -scale 0.64 -bgColor $darkBrandColor -isTransparent $true

# 3. android-icon-background.png (512x512, #1B0F0F)
$bgBmp = New-Object System.Drawing.Bitmap 512, 512
$bgG = [System.Drawing.Graphics]::FromImage($bgBmp)
$bgG.Clear($darkBrandColor)
$bgG.Dispose()
$bgBmp.Save("c:\Users\prath\Desktop\CODE\GymTracker\assets\images\android-icon-background.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bgBmp.Dispose()
Write-Host "Generated: android-icon-background.png"

# 4. favicon.png (192x192, dark background, 82% scale)
Generate-Padded-Icon -sourceImg $pBitmap -destPath "c:\Users\prath\Desktop\CODE\GymTracker\assets\images\favicon.png" -targetWidth 192 -targetHeight 192 -scale 0.82 -bgColor $darkBrandColor -isTransparent $false

# 5. splash-icon.png (512x512, dark background, 70% scale)
Generate-Padded-Icon -sourceImg $pBitmap -destPath "c:\Users\prath\Desktop\CODE\GymTracker\assets\images\splash-icon.png" -targetWidth 512 -targetHeight 512 -scale 0.70 -bgColor $darkBrandColor -isTransparent $false

# Also crop full logo (P mark + PRAVA text + subtitle) for logo_text.png
# Full logo bounds: 335, 101, 1122, 746
$fullRect = New-Object System.Drawing.Rectangle(335, 101, 1122, 746)
$fullLogoBmp = $src.Clone($fullRect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$fullLogoBmp.Save("c:\Users\prath\Desktop\CODE\GymTracker\assets\images\logo_text.png", [System.Drawing.Imaging.ImageFormat]::Png)
$fullLogoBmp.Dispose()
Write-Host "Generated: logo_text.png"

$pBitmap.Dispose()
$src.Dispose()
Write-Host "All assets generated flawlessly!"
