import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'cubit/footer_cubit.dart';
import 'footer_bloc_ui.dart';
import 'model/footer_model.dart';

class FooterScreen extends StatelessWidget {
  const FooterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xff637A9F),
      height: 250,
      margin: const EdgeInsets.only(top: 24),
      child: BlocBuilder<FooterCubit, List<FooterModel>>(
        builder: (context, state) {
          if (state.isEmpty) {
            BlocProvider.of<FooterCubit>(context).loadFooter();
            return const Center(child: CircularProgressIndicator());
          }
          return FooterBlocUI(
            data: state,
          );
        },
      ),
    );
  }
}
