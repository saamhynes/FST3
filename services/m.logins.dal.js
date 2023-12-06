const dal = require("./m.db");

async function getLogins() {
  try {
    await dal.connect();
    const cursor = await dal.db("Auth").collection("logins").find();
    const results = await cursor.toArray();
    return results;
  } catch(error) {
    console.log(error);
  }
};
async function getLoginByEmail(email) {
  try {
    await dal.connect();
    const result = await dal.db("Auth").collection("logins").findOne({ "email": email });
    if(DEBUG) console.error('mlogins.getLoginByEmail(' + email + '): ' + result.username)
    return result;
  } catch(error) {
    console.log(error);
  }
};
async function getLoginById(id) {
  try {
    await dal.connect();
    const cursor = await dal.db("Auth").collection("logins").find({ "_id": id });
    const result = await cursor.toArray();
    if(DEBUG) console.error('mlogins.getLoginById(' + id + '): ' + result.username)
    return result;
  } catch(error) {
    console.log(error);
  }
};
async function findByQuery(word) {
  try {
    const query = { $text: { $search: word } };
    await dal.connect();
    const cursor = await dal.db("Auth").collection("logins").find(query);
    const result = await cursor.toArray();
    if(DEBUG) console.error('mlogins.findByQuery(' + word + '): ' + JSON.stringify(result))
    return result;
  } catch(error) {
    console.log(error);
  }
};
async function addLogin(name, email, password, uuidv4) {
  let newLogin = JSON.parse(`{ "username": "` + name + `", "email": "` + email + `", "password": "` + password + `", "uuid": "` + uuidv4 + `" }`);
  try {
    await dal.connect();
    const result = await dal.db("Auth").collection("logins").insertOne(newLogin);
    return result.insertedId;
  } catch(error) {
    console.log(error);
  }
};

module.exports = {
    getLogins,
    addLogin,
    getLoginByEmail, 
    getLoginById,
    findByQuery,
  }