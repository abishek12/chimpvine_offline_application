import '../../onboarding/helper/date_time_helper.dart';

Future<int> remainingYear() async {
  final dateHelper = DateTableHelper();
  await dateHelper.insertDate('2024-05-13');
  List<String> dates = await dateHelper.getDates();
  DateTime storedDate = DateTime.parse(dates[0]);
  DateTime now = DateTime.now();
  int differenceInYears = now.year - storedDate.year;

  return differenceInYears;
}
