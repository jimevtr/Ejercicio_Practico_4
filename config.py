import os
import pymysql
from pymysql.cursors import DictCursor

# Configuración adaptada para conectar tu app local a la base de datos en Railway
DB_CONFIG = {
    "host": os.getenv("MYSQLHOST", "shortline.proxy.rlwy.net"),
    "user": os.getenv("MYSQLUSER", "root"),
    "password": os.getenv("MYSQLPASSWORD", "qZosrWOvXMDCckJoaTAVSbVonWHTjihh"),
    "database": os.getenv("MYSQLDATABASE", "railway"),
    "port": int(os.getenv("MYSQLPORT", 22937)),
    "cursorclass": DictCursor,
}


def get_connection():
    return pymysql.connect(**DB_CONFIG)