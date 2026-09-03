@echo off
REM =========================================================================
REM  MVIKAS Logistics — Local Dashboard Update Script
REM =========================================================================
title MVIKAS Dashboard Auto-Updater

echo ========================================================================
echo  MVIKAS Logistics Dashboard - Fetching Data from Google Sheet
echo ========================================================================
echo.

if "%GOOGLE_SHEET_URL%"=="" (
    set /p GOOGLE_SHEET_URL="Enter Google Sheet URL (or press Enter if configured in .env): "
)

python scripts\update_dashboard.py --source "%GOOGLE_SHEET_URL%" --output data\latest_data.json

if %ERRORLEVEL% equ 0 (
    echo.
    echo [SUCCESS] Dashboard dataset updated successfully in data\latest_data.json!
) else (
    echo.
    echo [ERROR] Failed to update dashboard. Please check your sheet link and internet connection.
)

pause
