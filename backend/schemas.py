from pydantic import BaseModel
from typing import Optional, List
from datetime import date

class UserBase(BaseModel):
    username: str
    role: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class StudentBase(BaseModel):
    name: str
    roll_number: str
    date_of_birth: Optional[str] = None
    grade_level: Optional[str] = None
    emergency_contact: Optional[str] = None

class StudentCreate(StudentBase):
    password: str

class Student(StudentBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class StudentUpdate(StudentBase):
    pass

class TeacherBase(BaseModel):
    name: str
    employee_id: str

class TeacherCreate(TeacherBase):
    password: str

class Teacher(TeacherBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class TeacherUpdate(TeacherBase):
    pass

class SubjectBase(BaseModel):
    name: str

class SubjectCreate(SubjectBase):
    pass

class Subject(SubjectBase):
    id: int
    class Config:
        from_attributes = True

class AttendanceBase(BaseModel):
    student_id: int
    subject_id: int
    date: date
    status: str

class AttendanceCreate(AttendanceBase):
    pass

class Attendance(AttendanceBase):
    id: int
    class Config:
        from_attributes = True

class AttendanceUpdate(AttendanceBase):
    pass

class ResultBase(BaseModel):
    student_id: int
    subject_id: int
    marks: float

class ResultCreate(ResultBase):
    pass

class Result(ResultBase):
    id: int
    class Config:
        from_attributes = True
