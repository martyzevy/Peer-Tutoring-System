from pymongo import MongoClient

# Your MongoDB Atlas connection string
uri = "your-mongodb-atlas-connection-string"

client = MongoClient(uri)

try:
    # Example: List databases
    print("Databases:", client.list_database_names())
finally:
    client.close()
