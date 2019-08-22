var mysql = require("mysql");
var connection = mysql.createConnection({
    host: "39.96.82.100",
    user: "root",
    password: "12345678",
    database: "blog",
});

connection.connect();

function queryLists(callback) {

    console.log("queryLists");

    connection.query("select * from postslist", function (error, results, fields) {
        if (error) {
            throw error;
        }
        
        callback(results);
        // return results;
    });
}

module.exports = queryLists;