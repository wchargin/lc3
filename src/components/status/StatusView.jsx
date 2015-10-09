import React, {Component} from 'react';
import {connect} from 'react-redux';

import RegisterView from './RegisterView';
import ControlButtons from './ControlButtons';
import {step} from '../../actions';

class StatusView extends Component {

    render() {
        return <div className="status-view">
            <h2>Status</h2>
            <RegisterView registers={this.props.lc3.registers} />
            <ControlButtons
                onStep={this.props.step}
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
        step: () => dispatch(step()),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(StatusView);
