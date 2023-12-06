import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../app/constant/app_color.dart';
import '../../app/widgets/text_widget.dart';
import '../cubit/subject_cubit.dart';
import '../model/subject_model.dart';
import '../widget/content_choose_dialog.dart';

class SubjectScreen extends StatelessWidget {
  const SubjectScreen({super.key});

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
                      builder: (context) => const ContentChooseDialog(
                        grade: "1",
                        subject: "Math",
                      ),
                    ),
                    child: Row(
                      children: [
                        SvgPicture.asset(subject.image),
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
