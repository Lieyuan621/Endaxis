@echo off
setlocal
title Endaxis 提示条
set "ROOT=%~dp0.."

rem 优先用 PATH 里的 node；没有就用仓库自带的 local\tooling\node.exe
where node >nul 2>nul
if not errorlevel 1 (
  set "NODE=node"
  goto :run
)

set "NODE=%ROOT%\local\tooling\node.exe"
if exist "%NODE%" goto :run

echo.
echo 未找到 Node.js。
echo 请先安装 Node.js（^>=20.19），或把 node.exe 放到 %ROOT%\local\tooling\ 下。
echo.
pause
exit /b 1

:run
echo 正在启动 Endaxis 桌面提示条（首次启动会先拉起开发服务器，约 5-10 秒）...
"%NODE%" "%ROOT%\desktop\launch.cjs" %*
echo.
echo 提示条已退出。
pause
