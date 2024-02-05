class UserModel {
  int? id;
  String username;
  String name;
  String address;
  int numberOfStudents;
  String establishmentDate;
  String contactNumber;
  String password;

  UserModel({
    this.id,
    required this.name,
    required this.address,
    required this.numberOfStudents,
    required this.establishmentDate,
    required this.contactNumber,
    required this.username,
    required this.password,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'numberOfStudents': numberOfStudents,
      'establishmentDate': establishmentDate,
      'contactNumber': contactNumber,
      'username': username,
      'password': password,
    };
  }

  factory UserModel.fromMap(Map<String, dynamic> map) {
    return UserModel(
      id: map['id'],
      username: map['username'],
      name: map['name'],
      address: map['address'],
      numberOfStudents: map['numberOfStudents'],
      establishmentDate: map['establishmentDate'],
      contactNumber: map['contactNumber'],
      password: map['password'],
    );
  }
}
