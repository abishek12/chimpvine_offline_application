import '../../app/constant/app_image.dart';

AppImage _appImage = AppImage();

final List<Map<String, dynamic>> homeBottomSheetItems = [
  {
    "title": "Search",
    "image": _appImage.search,
    "onTap": "searchScreen",
  },
  {
    "title": "Profile",
    "image": _appImage.person,
    "onTap": "profileScreen",
  },
  {
    "title": "About Us",
    "image": _appImage.about,
    "onTap": "aboutScreen",
  },
  {
    "title": "Upgrade",
    "image": _appImage.about,
    "onTap": "upgradeScreen",
  },
];
