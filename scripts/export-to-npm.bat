@echo off
setlocal enableextensions

echo Starting build...
cd /d "%~dp0.."

REM Call another batch file so control returns here
call ng build ks-ag-controls
if errorlevel 1 (
  echo Build failed!
  exit /b %errorlevel%
)

echo Build complete. Changing directory...
cd /d "dist\ks-ag-controls" || (
  echo Output folder not found!
  exit /b 1
)

echo Current directory: %CD%
echo Publishing to npm...
call npm publish --access public
if errorlevel 1 (
  echo Publish failed!
  exit /b %errorlevel%
)

echo Publish complete!
endlocal
