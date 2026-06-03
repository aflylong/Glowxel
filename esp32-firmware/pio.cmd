@echo off
setlocal

if defined PYTHONWARNINGS (
  set "PYTHONWARNINGS=%PYTHONWARNINGS%,ignore:::requests"
) else (
  set "PYTHONWARNINGS=ignore:::requests"
)

platformio %*
set "EXIT_CODE=%ERRORLEVEL%"

endlocal & exit /b %EXIT_CODE%
