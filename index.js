const Env = require('./src/Env.js')
const logger = require('./src/logger.js')
const Server = require('./src/WebSocketServer.js')
const RedisPool = require('./src/RedisPool')
const RedisChannel = require('./src/RedisChannel')

let wsHost = Env.get('WS_HOST', '0.0.0.0')
let wsPort = Env.getInt('WS_PORT', 63063)
let adminGroupId = Env.getInt("ADMIN_GROUP_ID", 0)
let _tag = Env.get('TAG', "S1")
let appSecret = Env.get('APP_SECRET', "")
let _redisPool = Env.get("REDIS_POOL", "redis://127.0.0.1:6379/0").split("|")
let _redisChannel = Env.get("REDIS_CHANNEL", "redis://127.0.0.1:6379/0")
let _time_to_live = 1507842000000

let redisPool = new RedisPool(_redisPool, logger, _tag)
let live = new RedisChannel(_redisChannel, logger, _tag)
let server = new Server(_tag, logger, appSecret, redisPool, live, adminGroupId)
server.listen(wsHost, wsPort)
live.listen()
logger.log( "RUN " + ( _time_to_live - Date.now() ) )

