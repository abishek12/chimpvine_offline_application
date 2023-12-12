import '../../app/constant/app_image.dart';

AppImage _appImage = AppImage();

final List<Map<String, dynamic>> homeBottomSheetItems = [
  {
    "title": "Search",
    "npTitle": "खोज",
    "image": _appImage.search,
    "onTap": "searchScreen",
  },
  {
    "title": "Profile",
    "npTitle": "खोज",
    "image": _appImage.person,
    "onTap": "profileScreen",
  },
  {
    "title": "About Us",
    "npTitle": "खोज",
    "image": _appImage.about,
    "onTap": "aboutScreen",
  },
  {
    "title": "Upgrade",
    "npTitle": "खोज",
    "image": _appImage.about,
    "onTap": "upgradeScreen",
  },
];
