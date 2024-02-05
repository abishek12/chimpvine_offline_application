import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';

class HomeFlexibleSpace extends StatelessWidget {
  const HomeFlexibleSpace({super.key});

  @override
  Widget build(BuildContext context) {
    return FlexibleSpaceBar(
      background: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          image: DecorationImage(
            fit: BoxFit.fill,
            image: AssetImage("assets/home/hero_section.png"),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: 10 * 8.0,
            vertical: 10 * 20,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Chimpvine',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10 * 5.0,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Gap(10 * 2),
              const Text(
                "loasdas ;sak dasd s;dsaldsl;dmsaldsmadl;smdmmas \n dasl dasl;dsald asdasdd loasdas ;sak dasd s;dsaldsl \n;dmsaldsmadl;smdmmas dasl dasl;dsald loasdas \n;sak dasd s;dsaldsl;dmsaldsmadl;smdmmas \n dasl dasl;dsald asdasdd loasdas ;sak dasd s;dsaldsl \n;dmsaldsmadl;smdmmas dasl dasl;dsald",
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10 * 2.0,
                ),
              ),
              const Gap(10 * 2),
              ElevatedButton.icon(
                onPressed: () => context.pushNamed("searchScreen"),
                label: const Text("Browse Now"),
                icon: const Icon(Icons.search),
              )
            ],
          ),
        ),
      ),
    );
  }
}
