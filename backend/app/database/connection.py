#app\database\connection.py
import pyodbc
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import urllib

# Your existing connection string logic
params = (
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=localhost;"
    "DATABASE=syntax26;"
    "UID=sa;"
    "PWD=MyStrongP@ss123;"
    "Encrypt=yes;"
    "TrustServerCertificate=yes;"
)

# SQLAlchemy needs the connection string in a specific URL format
quoted_params = urllib.parse.quote_plus(params)
engine = create_engine(f"mssql+pyodbc:///?odbc_connect={quoted_params}")

# This is what your Models should inherit from
Base = declarative_base()

# Helper for the rest of your app
def dict_cursor(connection):
    """Create a cursor that returns rows as dictionaries."""
    cursor = connection.cursor()
    columns = [column[0] for column in cursor.description]

    def dict_row_factory(row):
        return {columns[i]: value for i, value in enumerate(row)}

    cursor.row_factory = dict_row_factory
    return cursor


def get_sql_connection():
    connection = pyodbc.connect(params)
    connection.setdecoding(pyodbc.SQL_CHAR, encoding='utf-8')
    connection.setdecoding(pyodbc.SQL_WCHAR, encoding='utf-8')
    connection.setencoding(encoding='utf-8')
    return connection
def execute_query(query, params=None):
    """Executes a query. Returns rows for SELECT, or True for other operations."""
    conn = get_sql_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params or ())
        
        # Check if this is a SELECT query (which returns data)
        if query.strip().upper().startswith("SELECT"):
            rows = cursor.fetchall()
            # If you want to return a list of dictionaries instead of tuples:
            columns = [column[0] for column in cursor.description]
            return [dict(zip(columns, row)) for row in rows]
        
        # For INSERT, UPDATE, DELETE, MERGE
        conn.commit()
        return True
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()