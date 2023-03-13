let mysql = require("mysql");
// eslint-disable-next-line no-unused-vars
const { DB_USER, DB_PASS, DB_NAME, DB_HOST, INSTANCE_UNIX_SOCKET } = require("./config");

// create connection pool for persistent connection
// const pool = mysql.createPool({
//     connectionLimit: 10,
//     host: DB_HOST,
//     user: DB_USER,
//     password: DB_PASS,
//     database: DB_NAME,
//     port: "3306",
// });



const pool = mysql.createPool({
    // host:"34.73.28.11",
    user:DB_USER,
    password:DB_PASS,
    database:DB_NAME,
    socketPath:INSTANCE_UNIX_SOCKET,
    connectionLimit: 10,
    // [END cloud_sql_mysql_mysql_limit]

    // [START cloud_sql_mysql_mysql_timeout]
    // 'connectTimeout' is the maximum number of milliseconds before a timeout
    // occurs during the initial connection to the database.
    connectTimeout: 10000, // 10 seconds
    // 'acquireTimeout' is the maximum number of milliseconds to wait when
    // checking out a connection from the pool before a timeout error occurs.
    acquireTimeout: 10000, // 10 seconds
    // 'waitForConnections' determines the pool's action when no connections are
    // free. If true, the request will queued and a connection will be presented
    // when ready. If false, the pool will call back with an error.
    waitForConnections: true, // Default: true
    // 'queueLimit' is the maximum number of requests for connections the pool
    // will queue at once before returning an error. If 0, there is no limit.
    queueLimit: 0,
});

module.exports = pool;





