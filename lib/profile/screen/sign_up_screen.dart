import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../membership/helper/membership_helper.dart';
import '../../membership/model/user_model.dart';

class SignUpForm extends StatefulWidget {
  const SignUpForm({super.key});

  @override
  State<SignUpForm> createState() => _SignUpFormState();
}

class _SignUpFormState extends State<SignUpForm> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _addressController = TextEditingController();
  final _numberOfStudentsController = TextEditingController();
  final _establishmentDateController = TextEditingController();
  final _contactNumberController = TextEditingController();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10 * 5),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextFormField(
              controller: _usernameController,
              decoration: const InputDecoration(labelText: 'School Username'),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter the school username';
                }
                return null;
              },
            ),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'School Name'),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter the school name';
                }
                return null;
              },
            ),
            TextFormField(
              controller: _addressController,
              decoration: const InputDecoration(labelText: 'Address'),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter the address';
                }
                return null;
              },
            ),
            TextFormField(
              controller: _numberOfStudentsController,
              decoration:
                  const InputDecoration(labelText: 'Number of Students'),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter the number of students';
                }
                return null;
              },
            ),
            TextFormField(
              controller: _establishmentDateController,
              decoration:
                  const InputDecoration(labelText: 'Establishment Date'),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter the establishment date';
                }
                return null;
              },
            ),
            TextFormField(
              controller: _contactNumberController,
              decoration: const InputDecoration(labelText: 'Contact Number'),
              keyboardType: TextInputType.phone,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter the contact number';
                }
                return null;
              },
            ),
            TextFormField(
              controller: _passwordController,
              decoration: const InputDecoration(labelText: 'Password'),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter the password';
                }
                return null;
              },
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                if (_formKey.currentState?.validate() ?? false) {
                  _addMembership();
                }
              },
              child: const Text('Add Membership'),
            ),
          ],
        ),
      ),
    );
  }

  void _addMembership() async {
    UserModel newMembership = UserModel(
      name: _nameController.text,
      address: _addressController.text,
      numberOfStudents: int.parse(_numberOfStudentsController.text),
      establishmentDate: _establishmentDateController.text,
      contactNumber: _contactNumberController.text,
      username: _usernameController.text,
      password: _passwordController.text,
    );

    await DatabaseHelper.insertMembership(newMembership).then((value) {
      if (value > 0) {
        return showDialog(
            barrierDismissible: false,
            context: context,
            builder: (context) => AlertDialog(
                  title: const Text("Chimpvine"),
                  content: const Text("Account has been Created"),
                  actions: [
                    ElevatedButton(
                      onPressed: () => context.pop(),
                      child: const Text("Close"),
                    ),
                  ],
                ));
      } else {
        return showDialog(
            barrierDismissible: false,
            context: context,
            builder: (context) => AlertDialog(
                  content: const Text("Account has not been Created"),
                  actions: [
                    ElevatedButton(
                      onPressed: () => context.pop(),
                      child: const Text("Close"),
                    ),
                  ],
                ));
      }
    });
  }
}
