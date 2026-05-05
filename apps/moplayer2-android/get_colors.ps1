Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('C:\Users\Moalfarras\Desktop\moplayer2\logo.png')
$bmp = new-object System.Drawing.Bitmap($img)
$colors = @{}

for($x=0; $x -lt $bmp.Width; $x+=10){
    for($y=0; $y -lt $bmp.Height; $y+=10){
        $c = $bmp.GetPixel($x, $y)
        # Skip fully transparent, black/dark, white/bright
        if($c.A -gt 50 -and ($c.R -lt 240 -or $c.G -lt 240 -or $c.B -lt 240) -and ($c.R -gt 20 -or $c.G -gt 20 -or $c.B -gt 20)){
            $hex = '#{0:X2}{1:X2}{2:X2}' -f $c.R, $c.G, $c.B
            $colors[$hex]++
        }
    }
}

$colors.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 10 | Format-Table -AutoSize
