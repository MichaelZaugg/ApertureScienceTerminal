/****************************************
    Configuration
****************************************/

const _swf = {
    posScale: {
        x: 1.5,         // scale width and x positions
        y: 1.2          // scale height and y positions
    },
    lineSpace: 6,       // fudge line height - may need to change relative to posScale
    fontNudge: -0.3,    // fudge font size - may need to change relative to posScale
    speed: 1.0          // playback speed (scales setInterval delays)
}

let scriptAttr = (attr, fallback) => document.currentScript.hasAttribute(attr) ? document.currentScript.getAttribute(attr) : fallback

// root dir for assets
_swf.root = scriptAttr('swf-root', '.')

/****************************************
    Globals & Core Language Overrides
****************************************/

var _level0 = {
    refid: "level0"
}

var _this = document.currentScript.parentElement

var _eval = eval
eval = function (expr) {
    try {
        let e = _eval(expr)
        if (e == undefined) throw 1
        return e
    } catch (err) {
        console.log("EVAL fall through to element " + expr)
        return document.getElementById(expr)
    }
}

var _setInterval = setInterval
setInterval = function (target, name, delay) {
    return _setInterval(target[name], delay / _swf.speed)
}

var trace = console.log

function chr(i) {
    return String.fromCharCode(i)
}

function random(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function getUrl(url) {
    window.history.pushState(0, document.title)
    window.location.assign(url)
}

/****************************************
    Internal Helper Functions
****************************************/


_swf.getTextSize = function(txt, font, size) {
    // re-use canvas object for better performance
    var canvas = this.canvas || (this.canvas = document.createElement("canvas"));
    /** @type {CanvasRenderingContext2D} */
    var context = canvas.getContext("2d");
    
    // fudge font size down by ~half a pixel for more accuracy to flash
    size += _swf.fontNudge

    context.font = `${size}px ${font}`;
    var metrics = context.measureText(txt);
    var h = (size * _swf.posScale.y);
    return [
        metrics.width,
        size * _swf.posScale.y,

        metrics.width, /* TODO: account for word-spacing, text-indent, etc */
        (size + _swf.lineSpace) * _swf.posScale.y /* TODO: account for line-height instead of fudging? */
    ];
}

_swf.hexColor = (col) => '#' + parseInt(col).toString(16).padStart(6, '0')
_swf.intColor = (hex) => parseInt(hex.slice(1), 16)

function PlaceObject(name) {
    return _this.attachMovie(name, name, _this.getNextHighestDepth())
}


/****************************************
    HTMLElement (MovieClip) Methods
****************************************/

HTMLElement.prototype.loadVariables = function (url, target = '', method = 'GET') {
    //console.log(`loadVariables: ${url}`)
    // allow user-defined loadVariables
    if (typeof (loadVariables) == 'function') loadVariables(this, url, target, method)
}

HTMLElement.prototype.getNextHighestDepth = function () {
    if (this._nextHighestDepth == undefined)
        this._nextHighestDepth = 1

    return this._nextHighestDepth++
}

HTMLElement.prototype.attachMovie = function (symbolIdentifier, newName, depth, opt={}) {
    let movie = document.getElementById(newName)
    if (!!movie) return movie


    //console.log(`attachMovie: ${symbolIdentifier} ${newName} ${depth}`)

    let el = document.createElement("span")
    el.setAttribute("class", symbolIdentifier)
    el.setAttribute("id", newName)
    if (opt._visible == false) el.hidden = true
    //el.setAttribute("depth", depth)

    this.appendChild(el)

    return el
}

HTMLElement.prototype.attachVideo = function (netstream) {
    if (!!this._video) {
        netstream.video = this._video
        return this._video
    }
    let vid = document.createElement('video')

    this.appendChild(vid)

    netstream.video = vid
    this._video = vid

    return vid
}

class SWFField {
    constructor(element) {
        this._element = element
        this._text = ''
        this._bgColor = '#000000'
        this._bg = true

        this.password = false
    }
    
    get text() { return this._text }
    set text(value) { 
        this._text = value
        if (!this.password)
            this._element.textContent = value
        else
            this._element.textContent = '*'.repeat(value.length)
    }

    get length() { return this._element.textContent.length }

    get textColor() { return _swf.intColor(this.style.color) }
    set textColor(col) { this._element.style.color = _swf.hexColor(col) }

    get backgroundColor() { return _swf.intColor(this._bgColor) }
    set backgroundColor(col) {
        this._bgColor = _swf.hexColor(col)
        if (this._bg) this._element.style.backgroundColor = this._bgColor
    }

    get background() { return this._bg }
    set background(bg) {
        this._bg = bg
        if (bg) this._element.style.backgroundColor = this._bgColor
        else    this._element.style.backgroundColor = 'rgba(0, 0, 0, 0)'
    }

    get _alpha() { return parseInt(this._element.style.opacity) }
    set _alpha(a) { this._element.style.opacity = `${a}%` }

}

Object.defineProperty(HTMLElement.prototype, 'field', {
    get() {
        var field = this._field || (this._field = new SWFField(this))
        return field
    },
    set(value) { this._field = value }
})

Object.defineProperty(HTMLElement.prototype, '_visible', {
    get() { return !(this.hidden) },
    set(visible) { this.hidden = !visible }
})

Object.defineProperty(HTMLElement.prototype, '_x', {
    get() { return (this.offsetLeft) / _swf.posScale.x },
    set(x) { this.style.left = `${x * _swf.posScale.x}px` }
})

Object.defineProperty(HTMLElement.prototype, '_y', {
    get() { return (this.offsetTop) / _swf.posScale.y },
    set(y) { this.style.top = `${y * _swf.posScale.y}px` }
})

Object.defineProperty(HTMLElement.prototype, '_width', {
    //get() { return this.offsetWidth },
    get() { return (this.offsetWidth) / _swf.posScale.x },
    //set(w) { this.style.width = `${w}px` }
    set(w) { this.style.width = `${w * _swf.posScale.x}px` }
})

Object.defineProperty(HTMLElement.prototype, '_height', {
    //get() { return this.offsetHeight },
    get() { return (this.offsetHeight) / _swf.posScale.y },
    //set(h) { this.style.height = `${h}px` }
    set(h) { this.style.height = `${h * _swf.posScale.y}px` }
})


/****************************************
    Classes
****************************************/

class Key {
    static code = 0;

    static getCode() { return this.code; }
    
    static addListener(obj) {
        document.onkeydown = (e) => {
            this.code = e.keyCode
            obj.onKeyDown()
            return false
        }
    }
}

class Sound {

    constructor() {
        this.audio = new Audio()

        this.audio.addEventListener('ended', () => {
            if (typeof (this.onSoundComplete) == 'function') this.onSoundComplete()
        })
    }
    attachSound(str) {
        this.audio.src = `${_swf.root}/sounds/${str}.mp3`
    }

    setVolume(n) {
        this.audio.volume = n / 100
    }

    start() {
        this.audio.play()
    }
}

class TextFormat {

    constructor() {
        this.font = 'serif'
        this.size = 12
    }

    getTextExtent(txt) {
        let [w, h, tfw, tfh] = _swf.getTextSize(txt, this.font, this.size)
        return {
            textFieldWidth: tfw, width: w,
            textFieldHeight: tfh, height: h
        }
    }
}

class NetConnection {
    connect() {
    }
}

class NetStream {
    constructor() {
        this.hasEventListeners = false
        this.videoHasEnded = false
    }
    setBufferTime(t) {

    }

    play(url) {
        if (!this.video) return

        url += '.mp4'

        if (this.video.src.endsWith(url) && !this.video.paused) {
            return
        }
        
        this.video.src = url
        this.video.style.width = `${_swf.posScale.x * 100}%`;

        // HACK: problems with <video> _height
        this.video.style.marginBottom = `35px`
        this.video.style.marginTop = `25px`

        // HACK: set video to looping for now cause ended event listener causes stutter
        this.video.loop = true

        if (!this.hasEventListeners)
            this.video.addEventListener('timeupdate', () => {

                if (this.video.currentTime < 1) {
                    this.videoHasEnded = false
                }

                if (!this.videoHasEnded && this.video.currentTime >= this.video.duration - 1) {
                    if (typeof (this.onStatus) == 'function') {
                        this.onStatus({
                            code: 'NetStream.Play.Stop'
                        })
                    }
                    this.videoHasEnded = true
                }
            })
        this.hasEventListeners = true
        
        let promise = this.video.play()

        if (promise !== undefined) {
            promise.catch(err => {
                // if unmuted autoplay isn't allowed,
                // then mute audio and force it to play
                // with an invisible iframe
                // (if flash can autoplay, then so shall we)

                this.video.muted = true
                this.video.play()

                let iframe = document.createElement('iframe')
                iframe.src = this.video.src
                iframe.allow = 'autoplay'
                iframe.style.display = 'none';
                this.video.appendChild(iframe)

                // Switch back to real audio as soon as we can
                let listener = e => {
                    console.log('SWF: Switching to embededded audio')
                    this.video.muted = false
                    iframe.remove()
                    window.removeEventListener('pointerdown', listener)
                    window.removeEventListener('mousedown', listener)
                    window.removeEventListener('keydown', listener)
                }
                window.addEventListener('pointerdown', listener)
                window.addEventListener('mousedown', listener)
                window.addEventListener('keydown', listener)
            })
        }
    }

    close() {
        this.video.pause()
    }

    pause() {
        this.video.pause()
    }

    seek(t) {
        this.video.currentTime = t
    }
}


