/*
 * Manages stepping through the LC-3's batch mode,
 * executing instructions after delays for I/O (etc.).
 */
import React, {Component} from 'react';
import {connect} from 'react-redux';

import * as actions from '../actions';

const INTERVAL = 50;

class BatchModeManager extends Component {

    constructor() {
        super();
        this.intervalID = null;
        this.lock = false;  // when stepping is actively in progress
    }

    render() {
        return null;
    }

    shouldComponentUpdate(newProps) {
        return this.props.batch !== newProps.batch;
    }

    componentWillUnmount() {
        this._stopTimer();
    }

    componentDidUpdate() {
        if (this.props.batch) {
            this._startTimer();
        } else {
            this._stopTimer();
        }
    }

    _startTimer() {
        if (this.intervalID !== null) {
            return;
        }
        const callback = () => {
            if (this.props.batch) {
                if (!this.lock) {
                    this.lock = true;
                    window.setTimeout(() => {
                        this.props.onStepBatch();
                        this.lock = false;
                    });
                }
            } else {
                this._stopTimer();
            }
        };
        this.intervalID = window.setInterval(callback, INTERVAL);
        callback();
    }

    _stopTimer() {
        if (this.intervalID !== null) {
            window.clearInterval(this.intervalID);
            this.intervalID = null;
        }
    }

}

function mapStateToProps(state) {
    return {
        batch: state.get("lc3").batchState.running,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        onStep: () => dispatch(actions.step()),
        onStepBatch: () => dispatch(actions.stepBatch()),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(BatchModeManager);
