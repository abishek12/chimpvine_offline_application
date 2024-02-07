import 'package:flutter/material.dart';

import '../../membership/helper/membership_helper.dart';
import '../../membership/model/user_model.dart';

class ProfileListMembers extends StatefulWidget {
  const ProfileListMembers({super.key});

  @override
  State<ProfileListMembers> createState() => _ProfileListMembersState();
}

class _ProfileListMembersState extends State<ProfileListMembers> {
  late Future<List<UserModel>> memberships;
  @override
  void initState() {
    super.initState();
    memberships = DatabaseHelper.getAllMemberships();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
        future: memberships,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const CircularProgressIndicator();
          } else if (snapshot.hasError) {
            return Text('Error: ${snapshot.error}');
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('No memberships available.'));
          } else {
            return ListView.builder(
              physics: const NeverScrollableScrollPhysics(),
              shrinkWrap: true,
              itemCount: snapshot.data!.length,
              itemBuilder: (context, index) {
                return ListTile(
                  title: Text(snapshot.data![index].name),
                  subtitle: Text(snapshot.data![index].address),
                );
              },
            );
          }
        });
  }
}
