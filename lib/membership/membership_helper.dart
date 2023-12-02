import 'package:sqflite/sqflite.dart' as mysql;

class MemberShipDatabaseHelper {
  static Future<mysql.Database> createDb() async {
    return await mysql.openDatabase(
      'chimpvine_membership.db',
      version: 1,
      onCreate: (mysql.Database db, int version) async => await createTable(db),
    );
  }

  static Future<void> createTable(mysql.Database database) async {
    await database.execute("""CREATE TABLE membership(
      id int primary key auto_increment not null,
      school_name varchar(255),
      createdAt timestamp not null default current_timestamp
    )""");
  }

  static Future<int> createItem(String? schoolName) async {
    final db = await MemberShipDatabaseHelper.createDb();
    final data = {
      "school_name": schoolName,
    };

    final id = await db.insert(
      "items",
      data,
      conflictAlgorithm: mysql.ConflictAlgorithm.replace,
    );
    return id;
  }
}
