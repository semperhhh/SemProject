var mysql = require("mysql");

var connection;

function handleDisconnect() {
    
    connection = mysql.createConnection({
        host: "39.96.82.100",
        user: "root",
        password: "12345678",
        database: "blog",
    });
    
    connection.connect(function (error) {
        if (error) {
            console.log('connect error');
            setTimeout(handleDisconnect, 2000);
        }else {
            console.log('connect success');
        }
    });
    
    connection.on('error', function (error) {
        console.log('db error', error);
        if (error.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        }else {
            throw error;
        }
    });
}

handleDisconnect();


//查询-列表   
/*
    page 页数
*/
function queryLists(page, category, callback) {
    var sqlCount = (page ? page : 0) * 10;//如果没有默认1

    var sqlStr, sqlParam;
    if (category) {
        sqlStr = 'select * from postslist where category = ? order by id desc limit 10 offset ?';
        sqlParam = [category, sqlCount];
    }else {
        sqlStr = 'select * from postslist order by id desc limit 10 offset ?';
        sqlParam = [sqlCount];
    }
    connection.query(sqlStr, sqlParam, function (error, results, fields) {
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