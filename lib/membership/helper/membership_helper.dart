import 'package:flutter/material.dart';
import 'package:sqflite/sqflite.dart';

import '../model/user_model.dart';

class DatabaseHelper {
  static const _databaseName = 'membership.db';
  static const _databaseVersion = 1;
  static const int maxMemberships = 5;

  static Database? _database;

  static Future<Database> get database async {
    if (_database != null) return _database!;

    _database = await _initDatabase();
    return _database!;
  }

  static _initDatabase() async {
    return await openDatabase(
      _databaseName,
      version: _databaseVersion,
      onCreate: _onCreate,
    );
  }

  static Future _onCreate(Database db, int version) async {
    await db.execute('''
          CREATE TABLE memberships(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            name TEXT,
            address TEXT,
            password TEXT,
            numberOfStudents INTEGER,
            establishmentDate TEXT,
            contactNumber TEXT
          )
        ''');
  }

  // CRUD Operations

  // Insert
  static Future<int> insertMembership(UserModel membership) async {
    final db = await database;
    int? currentMemberships = Sqflite.firstIntValue(
      await db.rawQuery('SELECT COUNT(*) FROM memberships'),
    );

    // If the limit is reached, display a message and do not insert the new membership
    if (currentMemberships! >= maxMemberships) {
      _displayLimitReachedMessage();
      return -1;
    }
    return await db.insert('memberships', membership.toMap());
  }

  // Display a message when the membership limit is reached
  static void _displayLimitReachedMessage() {
    debugPrint('Membership limit reached. Cannot add more memberships.');
  }

  // Read all
  static Future<List<UserModel>> getAllMemberships() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query('memberships');
    return List.generate(maps.length, (i) => UserModel.fromMap(maps[i]));
  }

  // Read by username
  static Future<UserModel?> getMembershipByUsername(String username) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'memberships',
      where: 'username = ?',
      whereArgs: [username],
    );
    if (maps.isNotEmpty) {
      return UserModel.fromMap(maps[0]);
    }
    return null;
  }

  // Read by ID
  static Future<UserModel?> getMembershipById(int id) async {
    final db = await database;
    final List<Map<String, dynamic>> maps =
        await db.query('memberships', where: 'id = ?', whereArgs: [id]);
    if (maps.isNotEmpty) {
      return UserModel.fromMap(maps[0]);
    }
    return null;
  }

  // Update
  static Future<int> updateMembership(UserModel membership) async {
    final db = await database;
    return await db.update('memberships', membership.toMap(),
        where: 'username = ?', whereArgs: [membership.username]);
  }

  // Delete
  static Future<int> deleteMembership(String username) async {
    final db = await database;
    return await db
        .delete('memberships', where: 'username = ?', whereArgs: [username]);
  }
}
