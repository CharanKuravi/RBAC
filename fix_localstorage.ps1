# Fix bare localStorage calls in SSR context for the 3 client pages

# StudentDashboard
$f = 'c:\Users\kchar\OneDrive\Desktop\projects\exam-system!\exam-system!\exam-centre\frontend-next\src\app\dashboard\StudentDashboard.jsx'
$c = [System.IO.File]::ReadAllText($f)
$c = $c.Replace(
    'const rollNumber = localStorage.getItem(''roll_number'')',
    'const rollNumber = (typeof window !== ''undefined'') ? localStorage.getItem(''roll_number'') : ''''
)
[System.IO.File]::WriteAllText($f, $c)
Write-Host "Dashboard fixed"

# ExamClient
$f = 'c:\Users\kchar\OneDrive\Desktop\projects\exam-system!\exam-system!\exam-centre\frontend-next\src\app\exam\ExamClient.jsx'
$c = [System.IO.File]::ReadAllText($f)
$c = $c.Replace(
    'const rollNumber   = localStorage.getItem(''roll_number'')',
    'const rollNumber   = (typeof window !== ''undefined'') ? localStorage.getItem(''roll_number'') : ''''
)
[System.IO.File]::WriteAllText($f, $c)
Write-Host "Exam fixed"

# AdminClient
$f = 'c:\Users\kchar\OneDrive\Desktop\projects\exam-system!\exam-system!\exam-centre\frontend-next\src\app\admin\AdminClient.jsx'
$c = [System.IO.File]::ReadAllText($f)
$c = $c.Replace(
    'const role = localStorage.getItem(''role'')',
    'const role = (typeof window !== ''undefined'') ? localStorage.getItem(''role'') : null'
)
$c = $c.Replace(
    'const permissions = JSON.parse(localStorage.getItem(''permissions'') || ''[]'')',
    'const permissions = (typeof window !== ''undefined'') ? JSON.parse(localStorage.getItem(''permissions'') || ''[]'') : []'
)
[System.IO.File]::WriteAllText($f, $c)
Write-Host "Admin fixed"
