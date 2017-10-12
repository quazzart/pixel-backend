let logger = {
    log: (e, y) => {
        if (y) {
            console.log(e, y)
        } else {
            console.log(e)
        }
    },
    error: (e) => {
        console.error(e)
    },
    logTS: (e,y) => {
        let d = new Date()
        if (y) {
            console.log( d.toISOString() + ' ' + e, y)
        } else {
            console.log( d.toISOString() + ' ' + e)
        }
    }
}

module.exports = logger