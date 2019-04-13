type Coordinate = [number, number]
type MouseMoveListener = (x: number, y: number) => void

export class Telecanvas {
    private widthProperty!: number
    private mouseMoveListeners: MouseMoveListener[] = []
    private mouseDownListeners: Array<(x: number, y: number) => void> = []
    private mouseUpListeners: Array<() => void> = []
    private canvas: HTMLCanvasElement
    private context: CanvasRenderingContext2D

    constructor(parentElement: HTMLElement|null, public height: number, width?: number) {
        this.canvas = document.createElement('canvas')
        if (parentElement) {
            parentElement.appendChild(this.canvas)
            this.canvas.style.display = 'block'
        } else {
            document.body.appendChild(this.canvas)
            this.canvas.style.display = 'none'
        }
        this.canvas.height = height * this.dpr
        this.canvas.style.height = `${height}px`
        this.context = this.canvas.getContext('2d')!
        window.addEventListener('resize', () => {
            this.width = width ? width : parentElement!.clientWidth
        })
        window.dispatchEvent(new Event('resize'))

        const mousemove = (x: number, y: number) => {
            const rect = this.canvas.getBoundingClientRect()
            this.mouseMoveListeners.forEach(callback => callback(x - rect.left, y - rect.top))
        }
        const mousedown = (x: number, y: number) => {
            const rect = this.canvas.getBoundingClientRect()
            this.mouseDownListeners.forEach(callback => callback(x - rect.left, y - rect.top))
        }
        window.addEventListener('mousemove', (e) => mousemove(e.clientX, e.clientY))
        window.addEventListener('touchmove', (e) => mousemove(e.touches[0].clientX, e.touches[0].clientY))
        this.canvas.addEventListener('mousedown', (e) => mousedown(e.clientX, e.clientY))
        this.canvas.addEventListener('touchstart', (e) => mousedown(e.touches[0].clientX, e.touches[0].clientY))
        window.addEventListener('mouseup', () => this.mouseUpListeners.forEach(callback => callback()))
        window.addEventListener('touchend', () => this.mouseUpListeners.forEach(callback => callback()))
    }

    get width() {
        return this.widthProperty
    }

    set width(value: number) {
        this.widthProperty = value
        this.canvas.width = value * this.dpr
        this.canvas.style.width = `${value}px`
        this.context.scale(this.dpr, this.dpr)
    }

    get dpr() {
        return window.devicePixelRatio || 1
    }

    set cursor(value: string) {
        this.canvas.style.cursor = value
    }

    public save() {
        this.context.save()
    }

    public setRoundedClippingRect(left: number, top: number, width: number, height: number, radius: number) {
        const c = this.context
        c.beginPath()
        c.moveTo(left + radius, top)
        c.lineTo(left + width - radius, top)
        c.quadraticCurveTo(left + width, top, left + width, top + radius)
        c.lineTo(left + width, top + height - radius)
        c.quadraticCurveTo(left + width, top + height, left + width - radius, top + height)
        c.lineTo(left + radius, top + height)
        c.quadraticCurveTo(left, top + height, left, top + height - radius)
        c.lineTo(left, top + radius)
        c.quadraticCurveTo(left, top, left + radius, top)
        c.closePath()
        c.clip('nonzero')
    }

    public restore() {
        this.context.restore()
    }

    public line(from: Coordinate, to: Coordinate, color: string, width = 1) {
        const c = this.context
        c.lineCap = 'butt'
        c.strokeStyle = color
        c.lineWidth = width
        c.beginPath()
        c.moveTo(from[0] + .5, from[1] + .5)
        c.lineTo(to[0] + .5, to[1] + .5)
        c.stroke()
    }

    public path(path: Array<[number, number]>, color: string, width = 1) {
        const c = this.context
        c.lineJoin = 'miter'
        c.miterLimit = 2
        c.strokeStyle = color
        c.lineWidth = width
        c.beginPath()
        c.moveTo(path[0][0], path[0][1])
        for (let n = 1; n < path.length; n++) {
            c.lineTo(path[n][0], path[n][1])
        }
        c.stroke()
    }

    public circle(point: [number, number], radius: number, stroke: string|null, fill: string|null, borderWidth: number = 1) {
        const c = this.context
        c.beginPath()
        c.arc(point[0], point[1], radius, 0, 2 * Math.PI)
        if (fill) {
            c.fillStyle = fill
            c.fill()
        }
        if (stroke) {
            c.strokeStyle = stroke
            c.lineWidth = borderWidth
            c.stroke()
        }
    }

    public text(text: string, to: Coordinate, color: string, fontFamily = 'sans-serif', size = 14, align: 'left'|'right'|'center'|'start'|'end' = 'left') {
        const c = this.context
        c.fillStyle = color
        c.font = `${size}px "${fontFamily}"`
        c.textAlign = align
        c.fillText(text, to[0], to[1])
    }

    public shape(path: Array<[number, number]>, color: string) {
        const c = this.context
        c.fillStyle = color
        c.beginPath()
        c.moveTo(path[0][0], path[0][1])
        for (let n = 1; n < path.length; n++) {
            c.lineTo(path[n][0], path[n][1])
        }
        c.closePath()
        c.fill()
    }

    public rect(left: number, top: number, width: number, height: number, fill?: string, stroke?: string, borderWidth?: number) {
        const c = this.context
        c.beginPath()
        if (fill) {
            c.fillStyle = fill
            c.fillRect(left, top, width, height)
        }
        if (stroke) {
            c.strokeStyle = stroke
            c.lineWidth = borderWidth!
            c.strokeRect(left, top, width, height)
        }
    }

    public roundedRect(left: number, top: number, width: number, height: number, radius: number, fill?: string, stroke?: string, borderWidth?: number) {
        const c = this.context
        c.beginPath()
        c.moveTo(left + radius, top)
        c.lineTo(left + width - radius, top)
        c.quadraticCurveTo(left + width, top, left + width, top + radius)
        c.lineTo(left + width, top + height - radius)
        c.quadraticCurveTo(left + width, top + height, left + width - radius, top + height)
        c.lineTo(left + radius, top + height)
        c.quadraticCurveTo(left, top + height, left, top + height - radius)
        c.lineTo(left, top + radius)
        c.quadraticCurveTo(left, top, left + radius, top)
        c.closePath()
        if (fill) {
            c.fillStyle = fill
            c.fill()
        }
        if (stroke) {
            c.strokeStyle = stroke
            c.lineWidth = borderWidth!
            c.stroke()
        }
    }

    public drawTelecanvas(telecanvas: Telecanvas, destX: number, destY: number) {
        this.context.resetTransform()
        this.context.drawImage(telecanvas.canvas, destX * this.dpr, destY * this.dpr)
        if (this.dpr > 1) {
            this.context.scale(this.dpr, this.dpr)
        }
    }

    public clear() {
        this.context.clearRect(0, 0, this.width, this.height)
    }

    public addMouseMoveListener(callback: (x: number, y: number) => void) {
        this.mouseMoveListeners.push(callback)
    }

    public addMouseDownListener(callback: (x: number, y: number) => void) {
        this.mouseDownListeners.push(callback)
    }

    public addMouseUpListener(callback: () => void) {
        this.mouseUpListeners.push(callback)
    }

}
