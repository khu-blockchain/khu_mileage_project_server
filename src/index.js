const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const {sequelize} = require('./models');
const {createSchema} = require("./config/database/mysql");
const { adminService, caverService } = require('./services');

let server;

(async () => {
    try {
        // mysql 관련
        await createSchema();
        await sequelize.sync({ alter: true });

        // 3. root admin 생성 확인 및 없으면 생성
        await adminService.findAndCreateRootAdmin();

        // 4. admin keyring을 caver.js에 등록
        await caverService.addAdminKeyringAtCaverJs();

        // 5. 서버 실행
        server = app.listen(config.port, () => {
            logger.info('Listening to port %d', config.port);
        });
        server.keepAliveTimeout = 61 * 1000;
        server.headersTimeout = 65 * 1000; 
        // sequelize.sync({alter : true})
        //     .then(() => {
        //         // 서버 실행 관련
        //         server = app.listen(config.port, () => {
        //             logger.info('Listening to port %d', config.port);
        //         })
        //         server.keepAliveTimeout = 61 * 1000;
        //         server.headersTimeout = 65 * 1000; // This should be bigger than `keepAliveTimeout + your server's expected response time`
        //     })
        //     .catch((err) => {
        //         console.log(err);
        //     });

        // // root admin 생성 확인 및 없으면 생성
        // await adminService.findAndCreateRootAdmin();

        // // admin keyring caver에 등록
        // await caverService.addAdminKeyringAtCaverJs();
    } catch (e) {
        console.error(e);
        exitHandler();
    }
})()

const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger.info('Server closed');
            process.exit(1);
        })
    } else {
        process.exit(1);
    }
}

const unexpectedErrorHandler = (error) => {
    logger.error(error);
    exitHandler();
}

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGINT', exitHandler);

