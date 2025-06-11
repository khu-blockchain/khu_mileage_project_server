const mysql = require('mysql2');
const config = require('../config');

const con = mysql.createConnection({
    host: config.sequelize.host,
    password: config.sequelize.password,
    user: config.sequelize.username,
    port: config.sequelize.port,
})

const createSchema = async () => {
    console.log('createSchema called at :',config.sequelize.host,config.sequelize.port);
    return new Promise(async (resolve, reject) => {
        con.connect((e) => {
            if (e) {
                return reject(e);
            }
            con.query(`CREATE DATABASE IF NOT EXISTS ${config.sequelize.database}`, (e, result, fields) => {
              if (e) {
                  return reject(e);
              }
              con.end(); // 연결 종료는 query 실행 후 수행
              resolve(true);
          });
            // con.query(`create database ${config.sequelize.database}`, (e, result, fields) => {
            //     if (e) {
            //         if (e.code === 'ER_DB_CREATE_EXISTS') {
            //             resolve(true);
            //         } else {
            //             return reject(e);
            //         }
            //     }
            //     con.end();
            //     resolve(true);
            // })
        })
    })
}

module.exports = {
    createSchema
}
