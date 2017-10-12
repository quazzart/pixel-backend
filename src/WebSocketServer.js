const WebSocket = require('uws')
const User = require('./User.js')
const Message = require('./Message')
const Pixel = require('./Pixel')

class WebSocketServer {

    constructor(tag, logger, appSecret, channel, live, adminGroupId) {
        this.tag = tag
        this.logger = logger
        this.wss = null
        this.online = 0
        this.ttl = 60
        this.adminGroupId = adminGroupId
        this.appSecret = appSecret
        this.channel = channel
        this.timerForPublishOnline = null
        this.timerForBroadcastOnline = null
        this.live = live
        this.poolOnline = {}
        this.userLastAction = {}
        this.maxOnline = 0

        this.outputBuff = []
        this.outputBuffTs = 0
    }

    addToOutput(pix) {
        if (this.outputBuff.length === 0) {
            this.outputBuffTs = Date.now()
        }
        this.outputBuff.push(pix)
    }

    isFullBuff() {
        return this.outputBuff.length >= 40 || Date.now() - this.outputBuffTs > 1000
    }

    clearBuff() {
        this.outputBuff = []
    }

    listen(host, port) {
        this.close()

        this.wss = new WebSocket.Server({
            host: host,
            port: parseInt(port)
        })

        this.wss.on('connection', (connection, req) => this.onUserConnect(connection))
        this.clients = new Set()

        this.live.onRequestOnline( () => this.updateSelfOnline() )
        this.live.onSetOnline( e => this.onSetOnline(e))
        this.live.onPixel( e => this.onPixel(e) )
        this.live.onSetTtl( e => this.onSetTtl(parseInt(e.ttl, 10)) )
        this.live.onSetAdminGroupId( e => this.setAdminGroup(parseInt(e.id, 10)) )
        this.live.onReload( e => this.onReload(e) )

        setTimeout( () => this.channel.publishHello(), 1 )
    }

    onUserConnect(connection) {
        try {
            let url = connection.upgradeReq.url || ""
            const ip = connection.upgradeReq.headers ? connection.upgradeReq.headers['x-forwarded-for'] : 'local';

            const hasUserAgent = !!connection.upgradeReq.headers['user-agent']

            let user = User.fromQuery(url, this.appSecret, ip)

            if (user) {
                if (!hasUserAgent) {
                    this.logger.logTS( "Bad user " + user.id + ' ' + ip )
                    console.log(connection.upgradeReq.headers)
                    user.ban = true
                }
                connection.on('close', () => this.onUserClose(user, connection))
                connection.on('message', message => this.onUserMessage(user,connection,message))
                this.clients.add(connection)
                this.afterUserConnect( user, connection )
            } else {
                connection.terminate()
            }
        } catch (e) {
            this.logger.error(e)
        }

    }

    close() {
        if (this.wss) {
            this.wss.close()
            this.wss = null
        }
    }

    onUserClose(user, connection) {
        this.updateSelfOnline()
        this.broadcastOnline()
        this.clients.delete(connection)
    }

    onUserError(user, connection, error) {
        this.logger.log("USER ERROR " + user.id)
    }

    onUserMessage(user, connection, message) {
        if (!this.isAllowActionTtl(user.id) && !user.isAdmin(this.adminGroupId)) {
            return
        }

        if (user.ban) {
            return
        }

        if (typeof message === 'string') {
            // try {
            //     this.putPixel(user, message)
            // } catch (e) {
            //     this.logger.error(e)
            // }
        } else if ( (message instanceof ArrayBuffer) && message.byteLength === (4*4) ) {
            try {
                let data = new Int32Array(message, 0, 4)
                let x = data[0]
                let y = data[1]
                let colorId = data[2]
                let sign = data[3]
                this.onUserPixel(user, new Pixel(x, y, colorId, user.id, user.groupId, user.signatureType, sign))
            } catch (e) {
                this.logger.error(e)
            }
        } else {
            console.log([typeof message, (message instanceof ArrayBuffer )])
        }
    }

    putPixel(user, message) {
        let data = JSON.parse(message)
        if (data) {
            let pixel = new Pixel(data.x, data.y, data.color, user.id, user.groupId, user.signatureType, data.signature)
            this.onUserPixel(user, pixel)
        } else {
            this.logger.log("Bad pixel "+message)
        }
    }

    onUserPixel(user, pixel) {

        if (pixel.isValid()) {
            this.setActionTtl(user.id)
            this.channel.publishPixel(pixel, user)

            let msg = Message.getPixelMessage(
                pixel.x,
                pixel.y,
                pixel.colorId,
                user.isAdmin(this.adminGroupId) ? 0 : user.id,
                this.tag,
                user.isAdmin(this.adminGroupId) ? 0 : user.groupId
            )

            this.channel.broadcastPixel(msg.toString())
            this.onPixel( msg.value )
        } else {
            let msg = [
                "Invalid pixel signature uid:",
                user.id,
                "correct:",
                pixel.calculateSignature(),
                "pass:",
                pixel.signature
            ]
            this.logger.log(msg.join(' '))
        }
    }

    afterUserConnect(user, connection) {
        this.updateSelfOnline()
        if (connection.readyState === connection.OPEN) {
            connection.send( Message.getStateMessage(
                this.ttl,
                this.getOnline(),
                user.signatureType,
                user.isAdmin(this.adminGroupId) ? 0 : this.getUserWaitTime(parseInt(user.id, 10)),
                this.tag
            ).toString(), () => {} )
        }
        this.broadcastOnline()
    }

    broadcast( message ) {
        let str = message.toString()
        this.clients.forEach( connection => {
            if (connection.readyState === connection.OPEN) {
                connection.send( str )
            }
        } )
    }

    updateSelfOnline() {
        this.online = this.clients.size
        if (this.timerForPublishOnline === null) {
            this.timerForPublishOnline = setTimeout( () => {
                this.channel.publishOnline(this.tag, this.online)
                this.timerForPublishOnline = null
                if (this.online > this.maxOnline) {
                    this.logger.logTS( "Max online: " + this.online )
                    this.maxOnline = this.online
                }
            }, 5000)
        }
    }

    broadcastOnline() {
        if (this.timerForBroadcastOnline === null) {
            this.timerForBroadcastOnline = setTimeout( () => {
                this.broadcast( Message.getStateMessage(this.ttl, this.getOnline()) )
                this.timerForBroadcastOnline = null
            }, 10000 )
        }
    }

    getOnline() {
        let sum = 0
        for(let key in this.poolOnline) {
            if (this.poolOnline.hasOwnProperty(key)) {
                let s = parseInt(this.poolOnline[key], 10)
                if (!isNaN(s)) {
                    sum += s
                }
            }
        }
        return this.online + sum
    }

    isAllowActionTtl(userId) {
        if (Date.now() > 1507842000000) {
            return false
        }

        if (!this.userLastAction[userId]) {
            return true
        } else {
            return (Date.now() - this.userLastAction[userId]) > (this.ttl * 1000)
        }
    }

    setActionTtl(userId, delay = false) {
        this.userLastAction[userId] = Date.now() - (delay ? 200 : 0)
    }

    onSetTtl(newTtl) {
        if (this.ttl !== newTtl) {
            this.ttl = newTtl
            this.broadcastOnline()
            this.logger.log("New ttl " + this.ttl)
        }
    }

    setAdminGroup(id) {
        if (this.adminGroupId !== id) {
            this.adminGroupId = id
            this.logger.log("New admin group " + this.adminGroupId)
        }
    }

    onReload(e) {
        this.broadcast( new Message( Message.MESSAGE_TYPE_RELOAD, e ) )
        this.logger.log( "RELOAD " + JSON.stringify(e) )
    }

    onSetOnline(e) {
        if (e.tag !== this.tag) {
            this.poolOnline[e.tag] = e.online
            this.broadcastOnline()
        }
    }

    onPixel(e) {
        let {user_id} = e
        user_id = parseInt(user_id, 10)
        if (user_id !== 0) {
            this.setActionTtl(user_id, true)
        }

        if (Date.now() > 1507842000000) {return false}

        this.addToOutput(e)
        if (this.isFullBuff()) {
            let buffLength = this.outputBuff.length

            let buff = new ArrayBuffer( 4 * 5 * buffLength )

            this.outputBuff.forEach( (e, offset) => {
                let {user_id, group_id, x,y, color} = e
                let data = new Int32Array(buff, offset * 5 * 4, 5)
                data[0] = parseInt(x, 10)
                data[1] = parseInt(y, 10)
                data[2] = parseInt(color, 10)
                data[3] = user_id
                data[4] = parseInt(group_id, 10)
            } )

            this.clients.forEach( connection => {
                if (connection.readyState === connection.OPEN) {
                    connection.send( buff )
                }
            } )

            this.clearBuff()
        }
    }

    getUserWaitTime(userId) {
        if (this.userLastAction[userId]) {
            let t = Date.now() - this.userLastAction[userId]
            return t > (this.ttl * 1000) ? 0 : (this.ttl * 1000 - t)
        } else {
            return 0
        }
    }
}

module.exports = WebSocketServer