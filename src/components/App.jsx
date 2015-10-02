import React, {Component} from 'react';
import {Col, Navbar} from 'react-bootstrap';

import LC3 from '../core/lc3';

import LoadingMessage from './LoadingMessage';
import MemoryView from './memory/MemoryView';

export default class App extends Component {

    constructor() {
        super();
    }

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
        </div>;
    }

}
