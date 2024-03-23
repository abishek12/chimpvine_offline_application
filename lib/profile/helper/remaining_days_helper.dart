import '../../onboarding/helper/date_time_helper.dart';

Future<DateTime?> _getInstallationDate() async {
  final dateHelper = DateTableHelper();
  List<String> dates = await dateHelper.getDates();
  DateTime storedDate = DateTime.parse(dates[0]);
  return storedDate;
}

Future<int?> getRemainingDays() async {
  DateTime? storedDate = await _getInstallationDate();
  if (storedDate == null) {
    return null;
  }

  DateTime expiryDate = storedDate.add(const Duration(days: 2 * 365));

  DateTime now = DateTime.now();
  int remainingDays = expiryDate.difference(now).inDays;
  return remainingDays;
}
