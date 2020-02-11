var mysql = require("mysql");

var connection = mysql.createConnection({
    host: "39.96.82.100",
    user: "root",
    password: "12345678",
    database: "LastBlog",
});

connection.connect(function (error) {
    if (error) {
        console.log('connect error');
    } else {
        console.log('connect success');
    }
});

/// 心跳包
function queryHome(callback) {
    
    var sqlStr = "select * from postslist";
    connection.query(sqlStr, function (error, results, fields) {
        if (error) {
            throw error;
        }
        callback();
    });
}

//查询-列表   
/*
    page 页数
*/
function queryLists(page, category, callback) {
    var sqlCount = (page ? page : 0) * 10; //如果没有默认1

    var sqlStr, sqlParam;
    if (category) {
        sqlStr = 'select * from postslist where category = ? order by id desc limit 10 offset ?';
        sqlParam = [category, sqlCount];
    } else {
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

//查询-文章喜欢
function queryPostsLike(title, callback) {

    var sqlStr = "select likeed from postslist where title = ?";
    var sqlParam = [title];
    connection.query(sqlStr, sqlParam, function (error, results, fields) {
        if (error) {
            throw error;
        }

        var obj = results[0];//数据

        var sqlStr1 = "update postslist set likeed = ? where title = ?";
        var sqlParam1 = [obj.likeed + 1, title];

        connection.query(sqlStr1, sqlParam1, function (error1, results1, fields1) {
            if (error1) {
                throw error1;
            }
            callback(results1);
        })
    });
}

///文章阅读
function queryPostsRead(title, callback) {
    var sqlStr = 'select readed from postslist where title = ?';
    var sqlParam = [title];
    connection.query(sqlStr, sqlParam, function (error, results, fields) {
        if (error) {
            throw error;
        }

        var obj = results[0];
        var sqlStr1 = 'update postslist set readed = ? where title = ?';
        var sqlParam1 = [obj.readed + 1, title];
        connection.query(sqlStr1, sqlParam1, function (error1, results1, fields1) {
            if (error1) {
                throw error1;
            }
            callback(results1);
        })
    });
}

module.exports = {
    queryHome: queryHome,
    queryLists: queryLists,
    queryPosts: queryPosts,
    queryPostsLike: queryPostsLike,
    queryPostsRead: queryPostsRead,
}