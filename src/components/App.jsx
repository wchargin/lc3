import React, {Component} from 'react';
import {Col, Navbar} from 'react-bootstrap';

import LC3 from '../core/lc3';
import MemoryView from './MemoryView';

export default class App extends Component {

    constructor() {
        super();
        this.state = {
            lc3: LC3()
        };
    }

    render() {
        const lc3 = this.state.lc3;
        const row = lc3.get("memory").size - 10;

        return <div>
            <Navbar brand="LC-3 Simulator" inverse staticTop />
            <div className="container">
                <Col md={6}>
                    <MemoryView
                        lc3={lc3}
                        startAtRow={row}
                        activeRow={row}
                    />;
                </Col>
            </div>
        </div>;
    }

}
