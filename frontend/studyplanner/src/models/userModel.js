//frontend\studyplanner\src\models\userModel.js
export class UserModel {
  constructor(data) {
    this.token = data.token;
    this.refresh_token = data.refresh_token;

    this.student_id = data.student.student_id;
    this.full_name = data.student.full_name;
    this.email = data.student.email;
    this.class_level = data.student.class_level;
    this.institution_name = data.student.institution_name;
    this.city = data.student.city;
    this.age = data.student.age;
    this.role = data.student.role;
  }
}