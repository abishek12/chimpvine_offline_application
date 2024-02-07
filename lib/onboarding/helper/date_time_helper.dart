import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class DateTableHelper {
  static final DateTableHelper _instance = DateTableHelper._internal();
  factory DateTableHelper() => _instance;
  static Database? _database;

  DateTableHelper._internal();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await initDatabase();
    return _database!;
  }

  Future<Database> initDatabase() async {
    String path = join(await getDatabasesPath(), 'your_database.db');
    return await openDatabase(path, version: 1, onCreate: _onCreate);
  }

  void _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS date_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT
      )
    ''');
  }

  Future<void> insertDate(String date) async {
    final Database db = await database;
    await db.insert('date_table', {'date': date});
  }

  Future<List<String>> getDates() async {
    final Database db = await database;
    final List<Map<String, dynamic>> maps = await db.query('date_table');

    return List.generate(maps.length, (i) {
      return maps[i]['date'];
    });
  }
}
