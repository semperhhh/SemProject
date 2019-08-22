var mysql = require("mysql");
var connection = mysql.createConnection({
    host: "39.96.82.100",
    user: "root",
    password: "12345678",
    database: "blog",
});

connection.connect();

//查询-列表
function queryLists(callback) {

    connection.query("select * from postslist", function (error, results, fields) {
        if (error) {
            throw error;
        }
        callback(results);
    });
}

//查询-文章标题
function queryPosts(title, callback) {

    var sqlStr = "select * from postslist where title = ?";
    var sqlParam = [title];
    connection.query(sqlStr, sqlParam, function (error, results, fields) {
        if (error) {
            throw error;
        }
        callback(results);
    });
}

module.exports = {
    queryLists: queryLists,
    queryPosts: queryPosts
}