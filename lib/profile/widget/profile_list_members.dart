import 'package:flutter/material.dart';

import '../../membership/helper/membership_helper.dart';
import '../../membership/model/user_model.dart';
import '../helper/delete_member.dart';

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
          final item = snapshot.data;
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
              itemCount: item!.length,
              itemBuilder: (context, index) {
                final data = item[index];
                return ListTile(
                  title: Text(data.name),
                  subtitle: Text(data.address),
                  trailing: IconButton(
                    onPressed: () => deleteMember(data.username),
                    icon: const Icon(Icons.delete),
                  ),
                );
              },
            );
          }
        });
  }
}
