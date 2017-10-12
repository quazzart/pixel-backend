
class Env {
    static get(key, defaultValue) {
        if (typeof process.env[key] !== 'undefined') {
            return process.env[key]
        } else {
            return defaultValue
        }
    }

    static getInt(key, defaultValue) {
        return parseInt( Env.get(key, defaultValue) )
    }
}

module.exports = Env