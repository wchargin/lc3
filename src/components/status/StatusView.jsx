import React, {Component} from 'react';
import {connect} from 'react-redux';
import shallowEquals from 'shallow-equals';

import RegisterView from './RegisterView';
import ControlButtons from './ControlButtons';
import * as actions from '../../actions';

class StatusView extends Component {

    shouldComponentUpdate(newProps, newState) {
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
