import React, {Component} from 'react';
import {connect} from 'react-redux';

import RegisterView from './RegisterView';
import ControlButtons from './ControlButtons';
import * as actions from '../../actions';

class StatusView extends Component {

    render() {
        return <div className="status-view">
            <h2>Status</h2>
            <RegisterView
                registers={this.props.lc3.registers}
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
        lc3: state.get("lc3"),
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
