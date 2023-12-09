import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../model/subject_model.dart';

class SubjectCubit extends Cubit<List<SubjectModel>> {
  SubjectCubit() : super([]);

  void loadSubjects() async {
    try {
      final jsonString =
          await rootBundle.loadString('assets/json/subject.json');
      final List<dynamic> jsonList = json.decode(jsonString);
      final subjects =
          jsonList.map((json) => SubjectModel.fromJson(json)).toList();
      emit(subjects);
    } catch (e) {
      emit([]);
    }
  }
}
