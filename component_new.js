'use strict';

// radius of inner circle
const radius = 50;
// max radius of ripple = radius + extension
const extension = 75;



// number of frames for cycling through the 4 colors
const color_cycle = 800;
// number of frames for transition between colors
const transition = 60;



// maximum number of frames a ripple can exist for
const max_period = 180;
// minimum number of frames a ripple can exist for
const min_period = 60;
// maximum magnitude for the value of a color
const max_magnitude = 150;
// minimum magnitude for the value of a color
const min_magnitude = 50;
// amount of decay per frame
const decay = 0.125;



// maximum number of ripples
const n_ripples = 3;



// colors
const n = 4;
const c_red = '#bf596a';
const c_green = '#b9cd7c';
const c_blue = '#69acd5';
const c_yellow = '#dfa03b';
const c_all = [c_red, c_green, c_blue, c_yellow];



// frames per second
const fps = 60;



// given a color in hex string, return a hex string of the same color with given alpha
const setAlpha = (hex, alpha) => hex.substr(0, 7).concat(('0' + Math.floor(alpha * 255).toString(16)).substr(-2));



// extract components from rgb in hex
const red = hex => parseInt(hex.substr(1, 2), 16);
const green = hex => parseInt(hex.substr(3, 2), 16);
const blue = hex => parseInt(hex.substr(5, 2), 16);



// combine rgb components into a hex string
const color = (r, g, b) => '#'.concat(('0' + r.toString(16)).substr(-2))
                              .concat(('0' + g.toString(16)).substr(-2))
                              .concat(('0' + b.toString(16)).substr(-2));



// linearly interpolate colors c1 and c2 (result = t * c1 + (1 - t) * c2)
const lerp_color = (t, c1, c2) => {
    const r1 = red(c1), g1 = green(c1), b1 = blue(c1);
    const r2 = red(c2), g2 = green(c2), b2 = blue(c2);
    const r = r1 + Math.floor(t * (r2 - r1));
    const g = g1 + Math.floor(t * (g2 - g1));
    const b = b1 + Math.floor(t * (b2 - b1));
    return color(r, g, b);
}



const clamp = (x, min, max) => x < min ? min : x > max ? max : x;

class Widget extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            frame_count: -1,
            period: 180,
            last_frame: 0,
            values: [50, 50, 50, 50],
            ripples: [],
            c: c_red
        };
        this.key_frames = [0, 0, 0, 0];
    }



    componentDidMount() {
        // increment frame count every frame and componentDidUpdate will be called
        setInterval(() => {
            this.setState(prev => ({
                frame_count: prev.frame_count + 1
            }));
        }, 1000 / fps);
    }



    process(prev) {
        // update values with delta props.values
        for (let i = 0; i < n; ++i) {
            this.state.values[i] += this.props.values[i] - prev.values[i];
        }



        // current frame in current color cycle
        let t = this.state.frame_count % color_cycle;

        // at the beginning of each color cycle, make a copy of the current values
        // and do calculations which will be used for the entirety of this cycle
        // (to prevent sudden changes to the values in the middle of the cycle
        // messing the transitions up)
        if (t == 0) {
            this.key_frames = [...this.state.values];

            let total = 0;
            for (let i = 0; i < n; ++i) {
                total += this.key_frames[i];
            }

            // calculate the number of frames the next ripple exists for
            this.state.period = max_period - clamp(total, 1, n * max_magnitude) * (max_period - min_period) / (n * max_magnitude);

            // compute key_frames[i] = last frame for the i-th color
            for (let i = 0; i < n; ++i) {
                this.key_frames[i] *= color_cycle / total;
                if (i > 0) this.key_frames[i] += this.key_frames[i - 1];
            }
        }



        for (let i = 0; i < n; ++i) {
            // only consider the currently active color
            if (t <= this.key_frames[i]) {
                // decay
                if (this.state.values[i] > min_magnitude) {
                    this.state.values[i] -= decay;
                }

                // handle transition
                this.state.c = c_all[i];
                let last = i == 0 ? 0 : this.key_frames[i - 1];
                let threshold = this.key_frames[i] - transition;
                if (t >= threshold) {
                    this.state.c = lerp_color((t - threshold) / transition, this.state.c, c_all[(i + 1) % n]);
                }
                break;
            }
        }

        // add new ripple if it is time
        if (this.state.frame_count - this.state.last_frame >= this.state.period / n_ripples) {
            this.state.ripples.push({
                color: this.state.c,
                start: this.state.last_frame = this.state.frame_count,
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width / 2, canvas.height / 2);

        for (let i = 0; i < ripples.length; ++i) {
            const r = (this.state.frame_count - ripples[i].start) / ripples[i].period;

            // this ripple should die
            if (r >= 1) {
                ripples.shift();
                --i;
                continue;
            }

            // update alpha and render ripple
            ripples[i].color = setAlpha(ripples[i].color, 1 - r);
            this.circle(ctx, radius + r * extension, ripples[i].color);
        }

        // render central circle
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
            values: [0, 0, 0, 0]
        };
    }



    // increment this.state.values[ind] by x
    increment(ind, x) {
        let new_values = [...this.state.values];
        new_values[ind] += x;
        this.setState({values: new_values});
    }



    render() {
        return React.createElement(
            'div', {},
            React.createElement(
                Widget,
                {
                    values: this.state.values
                }
            ),
            React.createElement('button', {style: {width: '5%'}, onClick: () => this.increment(0, 10)}, 'R +'),
            React.createElement('button', {style: {width: '5%'}, onClick: () => this.increment(1, 10)}, 'G +'),
            React.createElement('button', {style: {width: '5%'}, onClick: () => this.increment(2, 10)}, 'B +'),
            React.createElement('button', {style: {width: '5%'}, onClick: () => this.increment(3, 10)}, 'Y +')
        );
    }
}



// render the widget
const domContainer = document.querySelector('#container');
const widgetContainer = React.createElement(WidgetContainer);
ReactDOM.render(widgetContainer, domContainer);
