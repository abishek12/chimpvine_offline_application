import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../app/constant/app_color.dart';
import '../../app/widgets/text_widget.dart';
import '../cubit/subject_cubit.dart';
import '../model/subject_model.dart';
import '../widget/content_choose_dialog.dart';

class SubjectScreen extends StatelessWidget {
  final int gradeIndex;
  const SubjectScreen({
    super.key,
    required this.gradeIndex,
  });

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SubjectCubit, List<SubjectModel>>(
      builder: (context, state) {
        if (state.isEmpty) {
          BlocProvider.of<SubjectCubit>(context).loadSubjects();
          return const Center(child: CircularProgressIndicator());
        }
        return SizedBox(
          width: 200,
          height: 250,
          child: ListView.builder(
              physics: const NeverScrollableScrollPhysics(),
              itemCount: state.length,
              itemBuilder: (context, index) {
                final subject = state[index];
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  child: InkWell(
                    onTap: () => showDialog(
                      context: context,
                      barrierDismissible: false,
                      builder: (context) => ContentChooseDialog(
                        grade: "${gradeIndex + 1}",
                        subject: index,
                        
                      ),
                    ),
                    child: Row(
                      children: [
                        SvgPicture.asset(
                          subject.image,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 8.0),
                        CustomText(
                          strText: subject.title,
                          fontSize: 20.0,
                          color: AppColor().whiteColor,
                        ),
                      ],
                    ),
                  ),
                );
              }),
        );
      },
    );
  }
}
