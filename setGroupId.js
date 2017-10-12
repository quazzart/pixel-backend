const Env = require('./src/Env.js')
const RedisPool = require('./src/RedisPool')
const logger = require('./src/logger.js')
const Message = require('./src/Message')

let _redisPool = Env.get("REDIS_POOL", "redis://127.0.0.1:6379/0").split("|")
let poll = new RedisPool(_redisPool, logger)

let groupId = parseInt(process.argv[2], 10)

if (!isNaN(groupId)) {
    poll.publish( "live", Message.getSetAdminGroupId(groupId).toString() )
    poll.close()
    logger.log("GroupId " + groupId)

} else {
    logger.log("GroupId is NaN!")
}




