class FooterModel {
  final String title;
  final String subTitle;
  final String image;

  FooterModel(this.title, this.image, this.subTitle);

  factory FooterModel.fromJson(Map<String, dynamic> json) {
    return FooterModel(
      json['title'],
      json['image'],
      json['subTitle'],
    );
  }
}
