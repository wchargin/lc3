import React, {Component} from 'react';
import {connect} from 'react-redux';

import * as actions from '../../actions';

class MemoryView extends Component {

    render() {
        return <div className="console-view">
            <h2>Console</h2>
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
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(MemoryView);
