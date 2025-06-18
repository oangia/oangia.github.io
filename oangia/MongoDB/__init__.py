connect = "mongodb+srv://hqnhatdn:XiSgrN0lRLq4A8ch@cluster0.wnkrqan.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
from pymongo import MongoClient
from bson.objectid import ObjectId
def mg_all(database, collection):
  client = MongoClient(connect)
  db = client[database]
  docs = db[collection].find()
  result = []
  for document in docs:
    result.append(document)
  return result

def mg_find_one(database, collection, id):
  client = MongoClient(connect)
  db = client[database]
  doc = db[collection].find_one({"_id": ObjectId(id)})
  return doc
# Create a connection to the local MongoDB server
mg_find_one('shopping', 'orders', '6597c21df6b47baca80952d4')
