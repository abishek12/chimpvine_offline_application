import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../helper/playground_helper.dart';

class PlayGroundGridWidget extends StatelessWidget {
  final String grade;
  final String subject;
  final String type;
  const PlayGroundGridWidget({
    super.key,
    required this.grade,
    required this.subject,
    required this.type,
  });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
        future: playgroundHelper(grade, subject, type),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }
          if (snapshot.hasError) {
            return Center(
              child: Text("${snapshot.error}"),
            );
          }
          if (snapshot.hasData) {
            final Map<String, dynamic>? data = snapshot.data;
            return SizedBox(
              width: MediaQuery.of(context).size.width,
              height: MediaQuery.of(context).size.height * 0.7,
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 4,
                ),
                itemCount: data!["count"],
                itemBuilder: (context, index) {
                  final Map<String, dynamic> items = data["items"][index];
                  return InkWell(
                    onTap: () => context.pushNamed(
                      "playgroundDetails",
                      pathParameters: {
                        "path": items['path'],
                      },
                    ),
                    child: Text(
                      items['title'],
                    ),
                  );
                },
              ),
            );
          }
          return const Center(
            child: CircularProgressIndicator(),
          );
        });
  }
}
