import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<bool> checkDeviceCompatibility() async {
  await getDeviceInfo();
  final SharedPreferences prefs = await SharedPreferences.getInstance();
  final String deviceName = prefs.getString("deviceName") ?? "";
  final String deviceVersion = prefs.getString("deviceVersion") ?? "";
  if (Platform.isAndroid) {
    return deviceName == "MacBook" && deviceVersion == "" ? true : false;
  } else {
    return false;
  }
}

Future getDeviceInfo() async {
  final DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
  AndroidDeviceInfo androidInfo = await deviceInfo.androidInfo;
  String? deviceName;
  String? deviceVersion;

  if (Platform.isAndroid) {
    deviceName = androidInfo.model;
    deviceVersion = androidInfo.version.release;
  }

  final prefs = await SharedPreferences.getInstance();
  await prefs.setString('deviceName', deviceName ?? "");
  await prefs.setString('deviceVersion', deviceVersion ?? "");
}
