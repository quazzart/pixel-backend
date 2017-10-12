const Message = require('./Message')

let redis = require("redis")

class RedisChannel {

    constructor(url, logger, tag) {
        if (url) {
            this.channel = redis.createClient({
                url: url
            })
        }
        this.logger = logger
        this.callbacks = {}
        this.lastMessage = {}
        this.tag = tag
    }

    listen() {
        this.channel.on("message", (channel, message) => {
            try {
                this.lastMessage = JSON.parse(message)
                let d = Message.fromRaw( this.lastMessage )
                if (d instanceof Message) {
                    this.onMessage(channel, d)
                } else {
                    this.logger.error(message)
                }
            } catch (e) {
                this.logger.error(e)
            }
        })

        this.channel.on("unsubscribe", (channel, count) => {
            this.logger.logTS("Called unsubscribe "+ channel+ " count "+ count)
        })
        this.channel.subscribe("live")
    }

    onMessage(channel, message) {
        if (message.type === Message.MESSAGE_TYPE_HELLO) {
            this.emit("onRequestStatus")
        }
        if (message.type === Message.MESSAGE_TYPE_SET_ONLINE) {
            this.emit("onSetOnline",  message.value )
        }
        if (message.type === Message.MESSAGE_TYPE_SET_TTL) {
            this.emit("onSetTtl",  message.value)
        }
        if (message.type === Message.MESSAGE_TYPE_RELOAD) {
            this.emit("onReload",  message.value )
        }
        if (message.type === Message.MESSAGE_TYPE_PIXEL) {
            if (message.value.user_ip !== this.tag) {
                this.emit("onPixel",  message.value )
            }
        }
        if (message.type === Message.MESSAGE_TYPE_SET_ADMIN_GROUP_ID) {
            this.emit("onSetAdminGroupId", message.value)
        }
    }

    on(eventName, callback) {
        this.callbacks[eventName] = callback
    }

    emit(eventName, event) {
        if (this.callbacks[eventName]) {
            this.callbacks[eventName](event)
        }
    }

    onRequestOnline(callback) {
        this.on("onRequestStatus", callback)
    }

    onSetOnline(callback) {
        this.on("onSetOnline", callback)
    }

    onPixel(callback) {
        this.on("onPixel", callback)
    }

    onSetTtl(callback) {
        this.on("onSetTtl", callback)
    }

    onSetAdminGroupId(callback) {
        this.on("onSetAdminGroupId", callback)
    }

    onReload(callback) {
        this.on("onReload", callback)
    }
}

module.exports = RedisChannel