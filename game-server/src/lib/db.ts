// import mysql from 'mysql2/promise';

// const promisePool = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASS,
//   database: process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   // Convert JSON fields to objects
//   typeCast: function (field, next) {
//     if (field.type === 'JSON') {
//       return JSON.parse(field.string());
//     }
//     return next();
//   },
// });

// export default promisePool;
import {Pool} from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  port: Number(process.env.DB_PORT) || 5432,
});

export default pool;
