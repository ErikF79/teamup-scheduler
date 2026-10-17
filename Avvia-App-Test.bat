@echo off
setlocal enabledelayedexpansion
title TeamUp Scheduler - Test locale
cd /d "%~dp0"

echo ============================================================
echo    TeamUp Scheduler - Avvio ambiente di test
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERRORE] Node.js non trovato.
    echo Scaricalo da https://nodejs.org e riprova.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [1/1] Installazione dipendenze in corso... attendere.
    call npm install
    if errorlevel 1 (
        echo [ERRORE] Installazione delle dipendenze fallita.
        pause
        exit /b 1
    )
    echo.
)

:menu
echo Scegli una modalita di avvio:
echo.
echo   1) Sviluppo    - avvio rapido con ricarica automatica (porta 9002)
echo   2) Produzione  - build statica + PWA/offline (porta 9002)
echo   3) Esci
echo.
set /p "scelta=Digita 1, 2 o 3 e premi INVIO: "

if "%scelta%"=="1" goto dev
if "%scelta%"=="2" goto prod
if "%scelta%"=="3" goto end
echo.
echo Scelta non valida.
echo.
goto menu

:dev
set "URL=http://localhost:9002"
echo.
echo Avvio del server di SVILUPPO su %URL% ...
echo (Premi CTRL+C in questa finestra per fermarlo)
echo.
start "" cmd /c "timeout /t 8 /nobreak >nul & start "" "%URL%""
call npm run dev
goto fine

:prod
set "URL=http://localhost:9002"
echo.
echo [1/2] Build statica di produzione in corso... attendere.
call npm run build
if errorlevel 1 (
    echo [ERRORE] Build fallita.
    pause
    goto menu
)
echo.
echo [2/2] Anteprima PRODUZIONE (build statica) su %URL% ...
echo (Premi CTRL+C in questa finestra per fermarla)
echo.
start "" cmd /c "timeout /t 6 /nobreak >nul & start "" "%URL%""
call npx --yes serve out -l 9002
goto fine

:fine
echo.
echo Server arrestato.
echo.
pause

:end
endlocal
