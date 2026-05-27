from databases import Database

DATABASE_URL = "mysql+aiomysql://uvdashadmin:Spero%401234%23@192.168.1.142:3306/uvdeskdb"

database = Database(
    DATABASE_URL,
    min_size=1,
    max_size=10
)