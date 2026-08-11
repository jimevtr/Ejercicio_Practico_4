import pymysql

HOST = "127.0.0.1"
PORT = 52054
USER = "root"
PASSWORD = "qZosrWOvXMDCckJoaTAVSbVonWHTjihh"
DATABASE = "railway"


def ejecutar_sql(conexion, archivo_sql):
    with open(archivo_sql, "r", encoding="utf-8") as archivo:
        contenido = archivo.read()

    # Elimina comentarios de una sola línea
    lineas = []
    for linea in contenido.splitlines():
        if not linea.strip().startswith("--"):
            lineas.append(linea)

    contenido = "\n".join(lineas)

    # Divide las sentencias respetando las cadenas entre comillas
    sentencias = []
    actual = []
    dentro_comilla = False
    escape = False

    for caracter in contenido:
        if caracter == "\\" and dentro_comilla:
            escape = not escape
            actual.append(caracter)
            continue

        if caracter == "'" and not escape:
            dentro_comilla = not dentro_comilla

        if caracter == ";" and not dentro_comilla:
            sentencia = "".join(actual).strip()

            if sentencia:
                sentencias.append(sentencia)

            actual = []
        else:
            actual.append(caracter)

        escape = False

    ultima = "".join(actual).strip()

    if ultima:
        sentencias.append(ultima)

    cursor = conexion.cursor()

    print(f"📄 Se encontraron {len(sentencias)} sentencias SQL")

    for numero, sentencia in enumerate(sentencias, start=1):
        try:
            cursor.execute(sentencia)
            print(f"✅ Sentencia {numero}/{len(sentencias)} ejecutada")
        except Exception as error:
            print(f"\n❌ Error en la sentencia {numero}:")
            print(error)
            print("\nSentencia:")
            print(sentencia[:1000])
            raise


try:
    conexion = pymysql.connect(
        host=HOST,
        port=PORT,
        user=USER,
        password=PASSWORD,
        database=DATABASE,
        charset="utf8mb4",
        autocommit=False,
        connect_timeout=10
    )

    print("✅ Conexión exitosa a MySQL de Railway")

    ejecutar_sql(conexion, "database.sql")

    conexion.commit()

    print("\n🎉 database.sql importado correctamente")

    cursor = conexion.cursor()

    cursor.execute("SHOW TABLES;")
    tablas = cursor.fetchall()

    print("\n📋 Tablas creadas:")

    for tabla in tablas:
        print(f"  ✅ {tabla[0]}")

    print("\n📊 Registros:")

    for tabla in ["Usuario", "Texto", "Marcador"]:
        cursor.execute(f"SELECT COUNT(*) FROM `{tabla}`")
        cantidad = cursor.fetchone()[0]

        print(f"  {tabla}: {cantidad}")

    conexion.close()

except Exception as error:
    print(f"\n❌ Error: {error}")

    if "conexion" in locals():
        conexion.rollback()
        conexion.close()