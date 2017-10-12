let redis = require("redis")
let Message = require("./Message")

class RedisPool {

    constructor(pool, logger, tag) {
        this.pool = pool.map(this.makeCollection)
        this.logger = logger
        this.tag = tag
    }

    makeCollection(url) {
        return redis.createClient({
            url: url
        })
    }

    publish(channel, message) {
        this.pool.forEach( pub => {
            pub.publish(channel, message)
        } )
    }

    publishOnline(tag, online) {
        this.publish( "live", Message.getSetOnlineMessage(tag,online).toString() )
    }

    publishHello() {
        this.publish( "live", Message.getHelloMessage().toString() )
    }

    publishPixel(pixel, user) {
        this.publish( "pixel", Message.getPixelMessage(
            pixel.x,
            pixel.y,
            pixel.colorId,
            user.id,
            user.ip,
            user.groupId
        ).toString() )
    }

    broadcastPixel(pixelAsString) {
        this.publish( "live", pixelAsString )
    }

    close() {
        this.pool.forEach( connection => {
            connection.quit()
        } )
    }
}

module.exports  = RedisPool