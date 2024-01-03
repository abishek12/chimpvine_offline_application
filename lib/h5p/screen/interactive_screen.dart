import 'package:flutter/material.dart';

import '../../home/widgets/app_bar_widget/app_logo_widget.dart';
import '../../home/widgets/app_bar_widget/home_app_bar.dart';
import '../utils/demo_h5p_items.dart';
import 'interactive_detail_screen.dart';

class InteractiveScreen extends StatelessWidget {
  const InteractiveScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Container(
          margin: const EdgeInsets.symmetric(
            horizontal: 60.0,
            vertical: 48.0,
          ),
          child: Column(
            children: [
              const HomeAppBar(isVisible: true),
              const AppLogoWidget(),
              SizedBox(
                height: 700,
                child: GridView.builder(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 4,
                      childAspectRatio: 1.5,
                    ),
                    itemCount: demoICitems.length,
                    itemBuilder: (context, index) {
                      return InkWell(
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => InteractiveDetailScreen(
                              fileName: demoICitems[index]['assets'],
                            ),
                          ),
                        ),
                        child: Card(
                          child: Text(demoICitems[index]['title']),
                        ),
                      );
                    }),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
