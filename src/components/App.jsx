import React, {Component} from 'react';
import {Col, Navbar} from 'react-bootstrap';

import LC3 from '../core/lc3';

import LoadingMessage from './LoadingMessage';
import MemoryView from './memory/MemoryView';
import StatusView from './status/StatusView';

export default class App extends Component {

    componentDidMount() {
        // Replace the static loading message
        // with a dynamic React component,
        // which will immediately fade out.
        const target = document.getElementById('container-wait');
        React.render(<LoadingMessage />, target);
    }

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
