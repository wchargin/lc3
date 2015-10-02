import React, {Component} from 'react';
import {Col, Navbar} from 'react-bootstrap';

import LC3 from '../core/lc3';
import MemoryView from './memory/MemoryView';

export default class App extends Component {

    render() {
        return <div>
            <Navbar brand="LC-3 Simulator" inverse staticTop />
            <div className="container">
                <Col md={6}>
                    <MemoryView />;
                </Col>
            </div>
        </div>;
    }

}
