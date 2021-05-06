'use strict';

const omega = 0.05;

class Widget2 extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            frameCount: 0,
            period: 180,
            lastFrame: 0,
            stable_values: [50, 50, 50, 50],
            values: [50, 50, 50, 50],
            ripples: [],
            polygons: [
                {radius: radius, angle: Math.random() * 2 * Math.PI, color: setAlpha(c_red, 0.5), dir: 1},
                {radius: radius, angle: Math.random() * 2 * Math.PI, color: setAlpha(c_green, 0.5), dir: -1},
                {radius: radius, angle: Math.random() * 2 * Math.PI, color: setAlpha(c_blue, 0.5), dir: 1},
                {radius: radius, angle: Math.random() * 2 * Math.PI, color: setAlpha(c_yellow, 0.5), dir: -1}
            ],
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
        for (let i = 0; i < 4; ++i) {
            this.state.values[i] += this.props.values[i] - prev.values[i];
            this.state.polygons[i].radius = clamp(this.state.values[i] / 150, 0.1, 1) * (radius + 0.5 * extension);
            this.state.polygons[i].angle += omega * clamp(this.state.values[i] / 150, 0.1, 1) * this.state.polygons[i].dir;
        }
        let t = this.state.frameCount % color_cycle;
        if (t == 0) {
            for (let i = 0; i < 4; ++i) {
                this.state.stable_values[i] = this.state.values[i];
            }
        }
        let total = 0;
        let values = [];
        for (let i = 0; i < 4; ++i) {
            values[i] = this.state.stable_values[i] + 1;
            total += values[i];
        }
        this.state.period = 180 - clamp(total, 1, 600) * 120 / 600;
        for (let i = 0; i < 4; ++i) {
            values[i] *= color_cycle;
            values[i] /= total;
            if (i > 0) values[i] += values[i - 1];
        }
        for (let i = 0; i < 4; ++i) {
            if (t <= values[i]) {
                // decay
                if (this.state.values[i] > 50) {
                    this.state.values[i] -= 0.125;
                }

                this.state.c = c_all[i];
                let last = i == 0 ? 0 : values[i - 1];
                let threshold = values[i] - transition;
                if (t >= threshold) {
                    this.state.c = lerp_color((t - threshold) / transition, this.state.c, c_all[(i + 1) % 4]);
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
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, 2 * Math.PI, false);
        ctx.fill();
    }

    polygon(ctx, theta, r, color) {
        ctx.save();
        ctx.rotate(theta);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(0, r);
        ctx.lineTo(-r, 0);
        ctx.lineTo(0, -r);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    componentDidUpdate(prev) {
        this.process(prev);
        const canvas = this.refs.canvas;
        const ctx = canvas.getContext('2d');
        const ripples = this.state.ripples;
        const polygons = this.state.polygons;
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width / 2, canvas.height / 2);

        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < polygons.length; ++i) {
            this.polygon(ctx, polygons[i].angle, polygons[i].radius, polygons[i].color);
        }

        ctx.globalCompositeOperation = "destination-over";
        this.circle(ctx, radius, this.state.c);
        for (let i = ripples.length - 1; i >= 0; --i) {
            const r = (this.state.frameCount - ripples[i].start) / ripples[i].period;
            if (r >= 1) {
                ripples.shift();
                break;
            }
            ripples[i].color = setAlpha(ripples[i].color, 1 - r);
            this.circle(ctx, radius + r * extension, ripples[i].color);
        }

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

class WidgetContainer2 extends React.Component {
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
                    prev.values[0] + Math.round(Math.random() * 15) / 2,
                    prev.values[1] + Math.round(Math.random() * 3) / 2,
                    prev.values[2] + Math.round(Math.random() * 20) / 2,
                    prev.values[3] + Math.round(Math.random() * 10) / 2
                ]
            }));
        }, 1000);
    }

    render() {
        return React.createElement(
            Widget2,
            {
                values: this.state.values
            }
        );
    }
}

const domContainer2 = document.querySelector('#container2');
const widgetContainer2 = React.createElement(WidgetContainer2);
ReactDOM.render(widgetContainer2, domContainer2);
// const widget2 = React.createElement(Widget2, {red: 0, green: 0, blue: 0, yellow: 0});
// ReactDOM.render(widget2, domContainer2);
