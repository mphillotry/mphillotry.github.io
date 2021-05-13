'use strict';

const particle_radius = 2;
const min_particle_speed = 4;
const max_particle_speed = 8;
const max_particle_trail = 8;


class Widget2 extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            frame_count: -1,
            period: 180,
            last_frame: 0,
            values: [50, 50, 50, 50],
            ripples: [],
            particles: [], 
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

                if (Math.floor(Math.random() * 16) == 0) {
                    let theta = 5 * Math.PI / 4 + Math.random() * Math.PI / 2;
                    let speed = min_particle_speed + Math.random() * (max_particle_speed - min_particle_speed);
                    this.state.particles.push({
                        x: 0,
                        y: 0,
                        vx: speed * Math.cos(theta),
                        vy: speed * Math.sin(theta),
                        color: this.state.c,
                        trail: []
                    });
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



    particle(ctx, particle) {
        for (let i = 0; i < particle.trail.length - 1; ++i) {
            ctx.beginPath();
            ctx.lineWidth = 2 * particle_radius * (i + 1) / particle.trail.length;
            ctx.strokeStyle = setAlpha(particle.color, (i + 1) / particle.trail.length);
            ctx.moveTo(particle.trail[i].x, particle.trail[i].y);
            ctx.lineTo(particle.trail[i + 1].x, particle.trail[i + 1].y);
            ctx.stroke();
        }

        if (particle.trail.length != 0) {
            ctx.beginPath();
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = 2 * particle_radius;
            ctx.moveTo(particle.trail[particle.trail.length - 1].x, particle.trail[particle.trail.length - 1].y);
            ctx.lineTo(particle.x, particle.y);
            ctx.stroke();
        }

        ctx.fillStyle = particle.color;
        ctx.arc(particle.x, particle.y, particle_radius, 0, 2 * Math.PI, false);
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

        for (let i = 0; i < this.state.particles.length; ++i) {
            this.state.particles[i].trail.push({
                x: this.state.particles[i].x,
                y: this.state.particles[i].y
            });
            if (this.state.particles[i].trail.length > max_particle_trail) {
                this.state.particles[i].trail.shift();
            }
            this.state.particles[i].x += this.state.particles[i].vx;
            this.state.particles[i].y += this.state.particles[i].vy;
            this.state.particles[i].vy += 0.1;
            if (this.state.particles[i].y > canvas.height / 2) {
                this.state.particles.splice(i, 1);
                --i;
                continue;
            }
            this.particle(ctx, this.state.particles[i]);
        }

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
                    width: 800,
                    height: 800
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
                Widget2,
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

const domContainer2 = document.querySelector('#container2');
const widgetContainer2 = React.createElement(WidgetContainer2);
ReactDOM.render(widgetContainer2, domContainer2);
