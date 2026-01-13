@echo off
echo ========================================
echo MongoDB Data Import Script
echo ========================================
echo.

set DB_NAME=Bida
set DATA_DIR=data\exported_extended_json

echo Importing data into database: %DB_NAME%
echo.

echo [1/7] Importing categories...
mongoimport --db %DB_NAME% --collection categories --file %DATA_DIR%\categories.json --drop
echo.

echo [2/7] Importing instructors...
mongoimport --db %DB_NAME% --collection instructors --file %DATA_DIR%\instructors.json --drop
echo.

echo [3/7] Importing students...
mongoimport --db %DB_NAME% --collection students --file %DATA_DIR%\students.json --drop
echo.

echo [4/7] Importing courses...
mongoimport --db %DB_NAME% --collection courses --file %DATA_DIR%\courses.json --drop
echo.

echo [5/7] Importing enrollments...
mongoimport --db %DB_NAME% --collection enrollments --file %DATA_DIR%\enrollments.json --drop
echo.

echo [6/7] Importing reviews...
mongoimport --db %DB_NAME% --collection reviews --file %DATA_DIR%\reviews.json --drop
echo.

echo [7/7] Importing payments...
mongoimport --db %DB_NAME% --collection payments --file %DATA_DIR%\payments.json --drop
echo.

echo ========================================
echo Import completed successfully!
echo ========================================
echo.
echo You can now start the web application:
echo   cd webapp
echo   npm install
echo   npm start
echo.
pause
