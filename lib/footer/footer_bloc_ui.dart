import 'package:chimpvine_offline_application/footer/footer_ui.dart';
import 'package:flutter/material.dart';

import 'model/footer_model.dart';

class FooterBlocUI extends StatelessWidget {
  final List<FooterModel> data;
  const FooterBlocUI({
    super.key,
    required this.data,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
      ),
      itemCount: data.length,
      itemBuilder: (context, index) => FooterUI(
        imageName: data[index].image,
        title: data[index].title,
        subTitle: data[index].subTitle,
      ),
    );
  }
}
