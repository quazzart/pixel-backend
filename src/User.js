const querystring = require('querystring')
const crypto = require('crypto')

class User {

    static fromQuery(url, secret, ip) {
        const parsedParams = querystring.parse(url)

        if (parsedParams.api_result) {
            parsedParams.api_result = encodeURIComponent(parsedParams.api_result)
        }

        if (parsedParams.ad_info) {
            parsedParams.ad_info = parsedParams.ad_info.replace(new RegExp(' ', 'g'), '+')
        }

        let sign = ''

        for (const key in parsedParams) {
            if (key === 'hash' || key === 'sign' || key === 'api_result') {
                continue
            }
            sign += parsedParams[key]
        }

        const hmac = crypto.createHmac('sha256', secret)
        hmac.write(sign)
        hmac.end()
        const hash = hmac.read().toString('hex')

        if (hash === parsedParams.sign) {
            return new User( parsedParams['viewer_id'], parsedParams['group_id'], parsedParams['viewer_type'], ip )
        } else {
            return null
        }
    }

    constructor(id, groupId, accessLevel, ip) {
        this.id = parseInt(id, 10)
        this.groupId = parseInt(groupId, 10)
        this.accessLevel = parseInt(accessLevel, 10)
        this.signatureType = Math.round( Math.random() * 2 ) + 4
        this.ip = ip
        this.ban = false
    }

    isAdmin(adminGroupId) {
        return this.accessLevel >= 2 && this.groupId === adminGroupId
    }
}

module.exports = User