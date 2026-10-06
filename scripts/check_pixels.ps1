Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("c:\Users\prath\Desktop\CODE\GymTracker\assets\images\Prava Track Progress Logo.png")
Write-Host "Pixel at (10, 10):" ($img.GetPixel(10, 10))
Write-Host "Pixel at (600, 101):" ($img.GetPixel(600, 101))
Write-Host "Pixel at (500, 200):" ($img.GetPixel(500, 200))
Write-Host "Pixel at (800, 200):" ($img.GetPixel(800, 200))
Write-Host "Pixel at (700, 300):" ($img.GetPixel(700, 300))
$img.Dispose()
