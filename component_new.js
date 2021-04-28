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
const fps = 60;

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

class Widget extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            frameCount: 0,
            period: 180,
            lastFrame: 0,
            values: [50, 50, 50, 50],
            ripples: [],
            c: c_red
        };
    }

    componentDidMount() {
        setInterval(() => {
            this.setState(prev => ({
                frameCount: prev.frameCount + 1
            }));
        }, 1000 / fps);
    }

    process(prev) {
        let n = this.state.values.length;
        if (this.props.flag != prev.flag) {
            for (let i = 0; i < n; ++i) {
                this.state.values[i] += this.props.values[i];
            }
        }
        let t = this.state.frameCount % color_cycle;
        let total = 0;
        let values = [];
        for (let i = 0; i < n; ++i) {
            values[i] = this.state.values[i] + 1;
            values[i] *= values[i];
            total += values[i];
        }
        this.state.period = 180 - Math.max(1, Math.min(total, 80000)) * 120 / 80000;
        for (let i = 0; i < n; ++i) {
            values[i] *= color_cycle;
            values[i] /= total;
            if (i > 0) values[i] += values[i - 1];
        }
        for (let i = 0; i < n; ++i) {
            if (t <= values[i]) {
                // decay
                if (this.state.values[i] > 50) {
                    this.state.values[i] -= 0.125;
                }

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

    circle(ctx, r, color) {
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(0, 0, r, 0, 2 * Math.PI, false);
        ctx.fill();
    }

    componentDidUpdate(prev) {
        this.process(prev);
        const canvas = this.refs.canvas;
        const ctx = canvas.getContext('2d');
        const ripples = this.state.ripples;
        ctx.save();
        ctx.beginPath();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width / 2, canvas.height / 2);
        for (let i = 0; i < ripples.length; ++i) {
            const r = (this.state.frameCount - ripples[i].start) / ripples[i].period;
            if (r >= 1) {
                ripples.shift();
                --i;
                continue;
            }
            ripples[i].color = setAlpha(ripples[i].color, 1 - r);
            this.circle(ctx, radius + r * extension, ripples[i].color);
        }
        this.circle(ctx, radius, this.state.c);
        ctx.restore();
    }

    render() {
        return React.createElement(
            'div', {},
            React.createElement(
                'canvas',
                {
                    ref: "canvas",
                    width: 400,
                    height: 400
                }
            ),
            React.createElement('br'),
            React.createElement('p', {}, 'red: ' + this.state.values[0]),
            React.createElement('p', {}, 'green: ' + this.state.values[1]),
            React.createElement('p', {}, 'blue: ' + this.state.values[2]),
            React.createElement('p', {}, 'yellow: ' + this.state.values[3])
        );
    }
}

class WidgetContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            values: [0, 0, 0, 0],
            flag: 0
        };
    }

    componentDidMount() {
        setInterval(() => {
            this.setState(prev => ({
                values: [
                    Math.round(Math.random() * 2),
                    Math.round(Math.random() * 2),
                    Math.round(Math.random() * 2),
                    Math.round(Math.random() * 2)
                ],
                flag: prev.flag ^ 1
            }));
        }, 1000);
    }

    render() {
        return React.createElement(
            Widget,
            {
                values: this.state.values,
                flag: this.state.flag
            }
        );
    }
}

const domContainer = document.querySelector('#container');
const widgetContainer = React.createElement(WidgetContainer);
ReactDOM.render(widgetContainer, domContainer);
// const widget = React.createElement(Widget, {red: 0, green: 0, blue: 0, yellow: 0});
// ReactDOM.render(widget, domContainer);
