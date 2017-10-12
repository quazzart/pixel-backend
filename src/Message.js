class Message {
    static getStateMessage(ttl, online, signature, wait, tag) {
        return new Message(Message.MESSAGE_TYPE_ONLINE, {
            online, ttl, signature, wait, tag
        })
    }

    static getSetOnlineMessage(tag, online) {
        return new Message(Message.MESSAGE_TYPE_SET_ONLINE, {
            tag, online
        })
    }

    static getHelloMessage() {
        return new Message(Message.MESSAGE_TYPE_HELLO, {})
    }

    static getPixelMessage(x,y,color, userId, userIp, groupId) {
        return new Message(Message.MESSAGE_TYPE_PIXEL, {
            x,y,color,user_id:userId, user_ip:userIp, group_id:groupId
        })
    }

    static getSetTtlMessage(ttl) {
        return new Message(Message.MESSAGE_TYPE_SET_TTL, {ttl})
    }

    static getSetAdminGroupId(id) {
        return new Message(Message.MESSAGE_TYPE_SET_ADMIN_GROUP_ID, {id})
    }

    static getReloadMessage(v) {
        return new Message(Message.MESSAGE_TYPE_RELOAD, {v})
    }

    static fromRaw(raw) {
        if (raw && raw.t && raw.v) {
            return new Message(raw.t, raw.v)
        } else {
            return null
        }
    }

    constructor(type, value) {
        this.type = type
        this.value = value
    }

    toString() {
        return JSON.stringify({t:this.type, v:this.value})
    }
}
Message.MESSAGE_TYPE_PIXEL = 1
Message.MESSAGE_TYPE_ONLINE = 2
Message.MESSAGE_TYPE_RELOAD = 3
Message.MESSAGE_TYPE_SET_ONLINE = 4
Message.MESSAGE_TYPE_HELLO = 5
Message.MESSAGE_TYPE_SET_TTL = 6
Message.MESSAGE_TYPE_SET_ADMIN_GROUP_ID = 7


module.exports = Message