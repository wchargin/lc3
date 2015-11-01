import React, {Component} from 'react';
import {connect} from 'react-redux';

import * as actions from '../../actions';

import Console from './Console';

class MemoryView extends Component {

    render() {
        return <div className="console-view">
            <h2>Console</h2>
            <Console
                console={this.props.console}
                onEnqueueStdin={this.props.onEnqueueStdin}
            />
        </div>;
    }

}

function mapStateToProps(state) {
    return {
        console: state.get("console"),
    };
}

function mapDispatchToProps(dispatch) {
    return {
        onEnqueueStdin: (text) => dispatch(actions.enqueueStdin(text)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(MemoryView);
