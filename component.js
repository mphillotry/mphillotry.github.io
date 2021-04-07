'use strict';

const radius = 50;
const extension = 75;
const color_cycle = 800;
const transition = 60;
const n_ripples = 3;
const c_red = '#bf596a';
const c_green = '#b9cd7c';
const c_blue = '#69acd5';
const c_yellow = '#dfa03b';
const c_all = [c_red, c_green, c_blue, c_yellow];

const setAlpha = (hex, alpha) => hex.substr(0, 7).concat(('0' + Math.floor(alpha * 255).toString(16)).substr(-2));

const red = hex => parseInt(hex.substr(1, 2), 16);
const green = hex => parseInt(hex.substr(3, 2), 16);
const blue = hex => parseInt(hex.substr(5, 2), 16);
const color = (r, g, b) => '#'.concat(('0' + r.toString(16)).substr(-2))
                              .concat(('0' + g.toString(16)).substr(-2))
                              .concat(('0' + b.toString(16)).substr(-2));

const lerp_color = (t, c1, c2) => {
    const r1 = red(c1), g1 = green(c1), b1 = blue(c1);
    const r2 = red(c2), g2 = green(c2), b2 = blue(c2);
    const r = r1 + Math.floor(t * (r2 - r1));
    const g = g1 + Math.floor(t * (g2 - g1));
    const b = b1 + Math.floor(t * (b2 - b1));
    return color(r, g, b);
}

const max = (x, y) => x > y ? x : y;
const min = (x, y) => x < y ? x : y;

class Widget extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            frameCount: 0,
            period: 180,
            lastFrame: 0,
            values: [0, 0, 0, 0],
            ripples: [],
            c: c_red
        };
        this.updateAnimationState = this.updateAnimationState.bind(this);
    }

    componentDidMount() {
        const canvas = this.refs.canvas;
        const ctx = canvas.getContext("2d");
        this.rAF = requestAnimationFrame(this.updateAnimationState);
    }

    process(...values) {
        let n = values.length;
        let total = 0;
        for (let i = 0; i < n; ++i) {
            ++values[i];
            values[i] *= values[i];
            total += values[i];
        }
        this.state.period = 180 - max(1, min(total, 80000)) * 120 / 80000;
        for (let i = 0; i < n; ++i) {
            values[i] *= color_cycle;
            values[i] /= total;
            if (i > 0) values[i] += values[i - 1];
        }
        let t = this.state.frameCount % color_cycle;
        for (let i = 0; i < n; ++i) {
            if (t <= values[i]) {
                this.state.c = c_all[i];
                let last = i == 0 ? 0 : values[i - 1];
                let threshold = values[i] - transition;
                if (t >= threshold) {
                    this.state.c = lerp_color((t - threshold) / transition, this.state.c, c_all[(i + 1) % n]);
                }
                break;
            }
        }
        if (this.state.frameCount - this.state.lastFrame >= this.state.period / n_ripples) {
            this.state.ripples.push({
                color: this.state.c,
                start: this.state.lastFrame = this.state.frameCount,
                period: this.state.period
            });
        }
    }

    updateAnimationState() {
        this.setState(prev => ({
            frameCount: prev.frameCount + 1
        }));
        this.rAF = requestAnimationFrame(this.updateAnimationState);
    }

    componentDidUpdate() {
        this.process(100,
                     60,
                     60,
                     60);
        const canvas = this.refs.canvas;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        ctx.save();
        ctx.beginPath();
        ctx.clearRect(0, 0, width, height);
        ctx.translate(width / 2, height / 2);
        for (let i = 0; i < this.state.ripples.length; ++i) {
            const r = (this.state.frameCount - this.state.ripples[i].start) / this.state.ripples[i].period;
            if (r >= 1) {
                this.state.ripples.shift();
                --i;
                continue;
            }
            this.state.ripples[i].color = setAlpha(this.state.ripples[i].color, 1 - r);
            ctx.beginPath();
            ctx.fillStyle = this.state.ripples[i].color;
            ctx.arc(0, 0, radius + r * extension, 0, 2 * Math.PI, false);
            ctx.fill();
        }
        ctx.beginPath();
        ctx.fillStyle = this.state.c;
        ctx.arc(0, 0, radius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.restore();
    }

    componentWillUnmount() {
        cancelAnimationFrame(this.rAF);
    }

    render() {
        return React.createElement(
            'canvas',
            {
                ref: "canvas",
                width: 400,
                height: 400
            },
            null
        );
    }
}

const domContainer = document.querySelector('#container');
ReactDOM.render(React.createElement(Widget), domContainer);

// https://philna.sh/blog/2018/09/27/techniques-for-animating-on-the-canvas-in-react/
