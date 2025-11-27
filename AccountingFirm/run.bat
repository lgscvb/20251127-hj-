@echo off
call venv\Scripts\activate.bat
set GOOGLE_APPLICATION_CREDENTIALS=gifthouse-438703-56f858f70c1f.json
set FLASK_APP=app.py
set FLASK_ENV=development
python app.py
pause 