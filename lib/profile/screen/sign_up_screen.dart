import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../authentication/widget/auth_text_field.dart';
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
  void dispose() {
    _nameController.dispose();
    _numberOfStudentsController.dispose();
    _addressController.dispose();
    _establishmentDateController.dispose();
    _contactNumberController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10 * 5),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AuthTextField(
              controller: _usernameController,
              hintText: 'Enter username',
              labelText: "Username",
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter the school username';
                }
                return null;
              },
            ),
            AuthTextField(
              controller: _nameController,
              hintText: 'Enter School Name',
              labelText: "Name",
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter the school name';
                }
                return null;
              },
            ),
            AuthTextField(
              controller: _addressController,
              hintText: 'Enter School Address',
              labelText: "Address",
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter the school address';
                }
                return null;
              },
            ),
            AuthTextField(
              controller: _numberOfStudentsController,
              hintText: 'Enter School Contact Details',
              labelText: "Address",
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter the school phone number';
                }
                return null;
              },
            ),
            AuthTextField(
              controller: _establishmentDateController,
              hintText: 'Enter School Address',
              labelText: "Address",
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter the date of establishment';
                }
                return null;
              },
            ),
            AuthTextField(
              controller: _contactNumberController,
              hintText: 'Enter School Address',
              labelText: "Address",
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter the school address';
                }
                return null;
              },
            ),
            AuthTextField(
              controller: _passwordController,
              hintText: 'Enter Password',
              labelText: "Address",
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter the school address';
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
        _nameController.clear();
        _addressController.clear();
        _numberOfStudentsController.clear();
        _addressController.clear();
        _establishmentDateController.clear();
        _contactNumberController.clear();
        _usernameController.clear();
        _passwordController.clear();
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
