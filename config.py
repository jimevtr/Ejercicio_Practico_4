import os
import pymysql
from pymysql.cursors import DictCursor


DB_CONFIG = {
    "host": os.getenv("MYSQLHOST", "localhost"),
    "user": os.getenv("MYSQLUSER", "root"),
    "password": os.getenv("MYSQLPASSWORD", "root"),
    "database": os.getenv("MYSQLDATABASE", "mecanografia_db"),
    "port": int(os.getenv("MYSQLPORT", "3306")),
    "cursorclass": DictCursor,
}


def get_connection():
    return pymysql.connect(**DB_CONFIG)