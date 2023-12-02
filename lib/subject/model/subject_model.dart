class SubjectModel {
  final String title;
  final String image;

  SubjectModel(this.title, this.image);

  factory SubjectModel.fromJson(Map<String, dynamic> json) {
    return SubjectModel(
      json['title'],
      json['image'],
    );
  }
}
