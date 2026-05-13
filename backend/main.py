from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
import models, schemas, database, auth
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
import csv
from io import StringIO
from datetime import datetime

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize admin
def init_db():
    db = database.SessionLocal()
    admin = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin:
        hashed_password = auth.get_password_hash("admin")
        db_admin = models.User(username="admin", hashed_password=hashed_password, role="Admin")
        db.add(db_admin)
        db.commit()
    db.close()

init_db()

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

# --- Admin Routes ---
@app.post("/students/", response_model=schemas.Student)
def create_student(student: schemas.StudentCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    hashed_password = auth.get_password_hash(student.password)
    db_user = models.User(username=student.roll_number, hashed_password=hashed_password, role="Student")
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    db_student = models.Student(name=student.name, roll_number=student.roll_number, date_of_birth=student.date_of_birth, grade_level=student.grade_level, emergency_contact=student.emergency_contact, user_id=db_user.id)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

@app.post("/students/upload/")
async def upload_students(file: UploadFile = File(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    content = await file.read()
    reader = csv.reader(StringIO(content.decode("utf-8")))
    next(reader, None) # skip header
    count = 0
    for row in reader:
        if len(row) >= 5:
            roll_number, name, dob, grade, emergency = row[0], row[1], row[2], row[3], row[4]
            # password default to roll_number
            password = roll_number
            if not db.query(models.User).filter(models.User.username == roll_number).first():
                hashed_password = auth.get_password_hash(password)
                db_user = models.User(username=roll_number, hashed_password=hashed_password, role="Student")
                db.add(db_user)
                db.commit()
                db.refresh(db_user)
                db_student = models.Student(name=name, roll_number=roll_number, date_of_birth=dob, grade_level=grade, emergency_contact=emergency, user_id=db_user.id)
                db.add(db_student)
                db.commit()
                count += 1
    return {"message": f"Successfully imported {count} students"}

@app.get("/students/", response_model=List[schemas.Student])
def read_students(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Student).offset(skip).limit(limit).all()

@app.put("/students/{student_id}", response_model=schemas.Student)
def update_student(student_id: int, student: schemas.StudentUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    for var, value in vars(student).items():
        if value is not None:
            setattr(db_student, var, value)
    db.commit()
    db.refresh(db_student)
    return db_student


@app.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(student)
    user = db.query(models.User).filter(models.User.id == student.user_id).first()
    if user:
        db.delete(user)
    db.commit()
    return {"message": "Student deleted"}

@app.post("/teachers/", response_model=schemas.Teacher)
def create_teacher(teacher: schemas.TeacherCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    hashed_password = auth.get_password_hash(teacher.password)
    db_user = models.User(username=teacher.employee_id, hashed_password=hashed_password, role="Teacher")
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    db_teacher = models.Teacher(name=teacher.name, employee_id=teacher.employee_id, user_id=db_user.id)
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher

@app.get("/teachers/", response_model=List[schemas.Teacher])
def read_teachers(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Teacher).offset(skip).limit(limit).all()

@app.put("/teachers/{teacher_id}", response_model=schemas.Teacher)
def update_teacher(teacher_id: int, teacher: schemas.TeacherUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not db_teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    for var, value in vars(teacher).items():
        if value is not None:
            setattr(db_teacher, var, value)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher


@app.delete("/teachers/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    db.delete(teacher)
    user = db.query(models.User).filter(models.User.id == teacher.user_id).first()
    if user:
        db.delete(user)
    db.commit()
    return {"message": "Teacher deleted"}

@app.post("/subjects/", response_model=schemas.Subject)
def create_subject(subject: schemas.SubjectCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_subject = models.Subject(name=subject.name)
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

@app.get("/subjects/", response_model=List[schemas.Subject])
def read_subjects(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Subject).offset(skip).limit(limit).all()

# --- Teacher Routes ---
@app.post("/attendance/", response_model=schemas.Attendance)
def mark_attendance(attendance: schemas.AttendanceCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["Admin", "Teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    db_attendance = models.Attendance(**attendance.dict())
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

@app.get("/attendance/", response_model=List[schemas.Attendance])
def get_all_attendance(skip: int = 0, limit: int = 1000, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.Attendance).offset(skip).limit(limit).all()

@app.put("/attendance/{attendance_id}", response_model=schemas.Attendance)
def update_attendance(attendance_id: int, attendance: schemas.AttendanceUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["Admin", "Teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    db_attendance = db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()
    if not db_attendance:
        raise HTTPException(status_code=404, detail="Attendance not found")
    for var, value in vars(attendance).items():
        if value is not None:
            setattr(db_attendance, var, value)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

@app.delete("/attendance/{attendance_id}")
def delete_attendance(attendance_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["Admin", "Teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    db_attendance = db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()
    if not db_attendance:
        raise HTTPException(status_code=404, detail="Attendance not found")
    db.delete(db_attendance)
    db.commit()
    return {"message": "Attendance deleted"}


@app.post("/attendance/upload/")
async def upload_attendance(file: UploadFile = File(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    content = await file.read()
    reader = csv.reader(StringIO(content.decode("utf-8")))
    next(reader, None) # skip header
    count = 0
    for row in reader:
        # Expected: Student_ID, Date, Subject, Attendance_Status
        if len(row) >= 4:
            roll_number, date_str, subject_name, status = row[0].strip(), row[1].strip(), row[2].strip(), row[3].strip()
            
            # Find student
            student = db.query(models.Student).filter(models.Student.roll_number == roll_number).first()
            if not student:
                continue
                
            # Find or create subject
            subject = db.query(models.Subject).filter(models.Subject.name == subject_name).first()
            if not subject:
                subject = models.Subject(name=subject_name)
                db.add(subject)
                db.commit()
                db.refresh(subject)
                
            # Parse date
            try:
                parsed_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except:
                try:
                    parsed_date = datetime.strptime(date_str, "%m/%d/%Y").date()
                except:
                    parsed_date = datetime.now().date()
                    
            db_attendance = models.Attendance(
                student_id=student.id,
                subject_id=subject.id,
                date=parsed_date,
                status=status
            )
            db.add(db_attendance)
            db.commit()
            count += 1
            
    return {"message": f"Successfully imported {count} attendance records"}

@app.post("/results/", response_model=schemas.Result)
def upload_marks(result: schemas.ResultCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["Admin", "Teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    db_result = models.Result(**result.dict())
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

@app.get("/results/", response_model=List[schemas.Result])
def get_all_results(skip: int = 0, limit: int = 1000, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.Result).offset(skip).limit(limit).all()

# --- Student Routes ---
@app.get("/my-attendance/", response_model=List[schemas.Attendance])
def get_my_attendance(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "Student":
        raise HTTPException(status_code=403, detail="Not authorized")
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    return db.query(models.Attendance).filter(models.Attendance.student_id == student.id).all()

@app.get("/my-results/", response_model=List[schemas.Result])
def get_my_results(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "Student":
        raise HTTPException(status_code=403, detail="Not authorized")
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    return db.query(models.Result).filter(models.Result.student_id == student.id).all()

@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
