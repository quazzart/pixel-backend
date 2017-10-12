const Env = require('./src/Env.js')
const RedisPool = require('./src/RedisPool')
const logger = require('./src/logger.js')
const Message = require('./src/Message')

let _redisPool = Env.get("REDIS_POOL", "redis://127.0.0.1:6379/0").split("|")
let poll = new RedisPool(_redisPool, logger)

let ttl = parseInt(process.argv[2], 10)

if (!isNaN(ttl)) {
    poll.publish( "live", Message.getSetTtlMessage(ttl).toString() )
    poll.close()
    logger.log("Publish " + ttl)

} else {
    logger.log("TTL is NaN!")
}




