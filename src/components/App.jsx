import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {Col} from 'react-bootstrap';

import MemoryView from './memory/MemoryView';
import StatusView from './status/StatusView';

export default class App extends Component {

    render() {
        return <div className="container">
            <Col md={6}>
                <MemoryView />
            </Col>
            <Col md={6}>
                <StatusView />
            </Col>
        </div>;
    }

}
