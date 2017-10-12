const Env = require('./src/Env.js')
const RedisPool = require('./src/RedisPool')
const logger = require('./src/logger.js')
const Message = require('./src/Message')

let _redisPool = Env.get("REDIS_POOL", "redis://127.0.0.1:6379/0").split("|")
let poll = new RedisPool(_redisPool, logger)

let v = parseInt(process.argv[2], 10)

if (!isNaN(v)) {
    poll.publish( "live", Message.getReloadMessage(v).toString() )
    poll.close()
    logger.log("Reload from " + v)

} else {
    logger.log("Version is NaN!")
}




