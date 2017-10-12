class Pixel {

    constructor(x, y, colorId, userId, groupId, signatureType, signature) {
        this.x = parseInt(x, 10)
        this.y = parseInt(y, 10)
        this.colorId = parseInt(colorId, 10)
        this.userId = parseInt(userId, 10)
        this.groupId = parseInt(groupId, 10)
        this.signatureType = parseInt(signatureType, 10)
        this.signature = parseInt(signature, 10)
    }

    calculateSignature() {
        if (this.signatureType === 1) {
            return this.x + this.y - this.colorId + this.groupId + 20
        } else if (this.signatureType === 2) {
            return this.x - this.y + this.colorId + this.groupId + 15
        } else if (this.signatureType === 3) {
            return this.x - this.y*2 + this.colorId + this.groupId + 100
        } else if (this.signatureType === 4) {
            return this.getTag1(this.x - this.y*2) + this.colorId + this.userId + 105
        } else if (this.signatureType === 5) {
            return this.getTag2(this.x - this.y*2) + this.colorId + this.userId + 102
        } else if (this.signatureType === 6) {
            return this.getTag1(this.x - 1 - this.y*2) + this.colorId + this.userId + 103
        }
        return Date.now().toString()
    }

    isValidRange() {
        return this.x >= 0
            && this.x < 1590
            && this.y >= 0
            && this.y < 400
            && this.colorId >= 0
            && this.colorId < 19
    }

    isValid() {
        let signCheck1 = this.calculateSignature() === this.signature
        let signCheck2 = (this.calculateSignature() % 256) === this.signature

        return (signCheck1 || signCheck2) && this.isValidRange()
    }

    getTag1( x ) {
        return Math.round( (Math.log2( Math.abs(x) + 1 ) ) * 1000 )
    }

    getTag2( x ) {
        return Math.round( (Math.log1p( Math.abs(x) + 1 ) ) * 1000 )
    }

    toByte() {
        let buff = new ArrayBuffer( 4 * 5 )
        let data = new Int32Array(buff, 0, 5)
        data[0] = this.x
        data[1] = this.y
        data[2] = this.colorId
        data[3] = this.userId
        data[4] = this.groupId
        return buff
    }
}

module.exports = Pixel