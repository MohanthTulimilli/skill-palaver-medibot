@echo off
setlocal
where mvn >nul 2>&1
if %ERRORLEVEL% equ 0 (
  mvn %*
  exit /b %ERRORLEVEL%
)
set "MAVEN_HOME=%USERPROFILE%\.m2\wrapper-maven"
set "MAVEN_ZIP=%MAVEN_HOME%\apache-maven-3.9.6-bin.zip"
if not exist "%MAVEN_HOME%\apache-maven-3.9.6\bin\mvn.cmd" (
  echo Maven not found in PATH. Downloading Maven 3.9.6 to %MAVEN_HOME%...
  if not exist "%MAVEN_HOME%" mkdir "%MAVEN_HOME%"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.6/apache-maven-3.9.6-bin.zip' -OutFile '%MAVEN_ZIP%' -UseBasicParsing }"
  if not exist "%MAVEN_ZIP%" (
    echo Failed to download Maven. Install Maven manually: https://maven.apache.org/download.cgi
    exit /b 1
  )
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '%MAVEN_ZIP%' -DestinationPath '%MAVEN_HOME%' -Force"
)
call "%MAVEN_HOME%\apache-maven-3.9.6\bin\mvn.cmd" %*
exit /b %ERRORLEVEL%

