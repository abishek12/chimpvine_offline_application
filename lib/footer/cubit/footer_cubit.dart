import 'dart:convert';

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter/services.dart';

import '../model/footer_model.dart';

class FooterCubit extends Cubit<List<FooterModel>> {
  FooterCubit() : super([]);
  void loadFooter() async {
    try {
      final jsonString = await rootBundle.loadString('json/footer.json');
      final List<dynamic> jsonList = json.decode(jsonString);
      final subjects =
          jsonList.map((json) => FooterModel.fromJson(json)).toList();
      emit(subjects);
    } catch (e) {
      emit([]);
    }
  }
}
