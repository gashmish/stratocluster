var config = {}


/* Postgres connection */

config.pg = {};
config.pg.user = "postgres";
config.pg.password = "123456";
config.pg.host = '127.0.0.1';
config.pg.dbname = 'postgres';


/* Server */

config.web = {};
config.web.host = '0.0.0.0';
config.web.port = '8088';


/* Logging */

config.log = {};
config.log.file = "server.log"; 


module.exports = config;
