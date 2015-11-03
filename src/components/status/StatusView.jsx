import React, {Component} from 'react';
import {connect} from 'react-redux';
import shallowEquals from 'shallow-equals';

import RegisterView from './RegisterView';
import ControlButtons from './ControlButtons';
import * as actions from '../../actions';

class StatusView extends Component {

    shouldComponentUpdate(newProps, newState) {
        /*
         * We don't want to update all the time in batch mode.
         * During batch mode, we'll gray out the interface,
         * so we only need to re-render twice:
         * when we exit and when we leave.
         */
        if (this.props.batch !== newProps.batch) {
            return true;
        }
        if (this.props.batch && newProps.batch) {
            return false;
        }

        return !shallowEquals(this.props, newProps) ||
            !shallowEquals(this.state, newState);
    }


    render() {
        return <div className="status-view">
            <h2>Status</h2>
            <RegisterView
                registers={this.props.registers}
                onSetRegister={this.props.onSetRegister}
            />
            <ControlButtons
                onStep={this.props.onStep}
            />
        </div>;
    }

}

function mapStateToProps(state) {
    return {
        batch: state.get("lc3").batchState.running,
        registers: state.get("lc3").registers,
        viewOptions: state.get("viewOptions"),
    };
}

function mapDispatchToProps(dispatch) {
    return {
        onStep: () => dispatch(actions.step()),
        onSetRegister: (name, value) =>
            dispatch(actions.setRegister(name, value)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(StatusView);
