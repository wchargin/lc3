import React, {Component} from 'react';
import {Button, ButtonGroup, ButtonToolbar, OverlayTrigger, Popover, Glyphicon} from 'react-bootstrap';
import MemorySearch from './MemorySearch';

export default class MemoryNav extends Component {

    render() {
        const scrollDelta = 1;
        const groupStyle = { float: "none" };
        return <ButtonToolbar className="center-block">
            <ButtonGroup style={groupStyle}>
                <Button onClick={() => this.props.onScrollBy(-scrollDelta)}>
                    <Glyphicon glyph="chevron-up" alt="Scroll memory up" />
                </Button>
                <Button onClick={() => this.props.onScrollBy(scrollDelta)}>
                    <Glyphicon glyph="chevron-down" alt="Scroll memory down" />
                </Button>
                <Button onClick={this.props.onScrollToPC}>
                    Jump to PC
                </Button>
                <OverlayTrigger
                    placement="bottom"
                    trigger="click"
                    rootClose
                    overlay={
                        <Popover id="memory-search">
                            <MemorySearch
                                symbolTable={this.props.symbolTable}
                                onScrollTo={this.props.onScrollTo}
                                ref="search"
                            />
                        </Popover>
                    }
                    onEntering={() => this.refs.search.focus()}
                >
                    <Button>Jump to&hellip;</Button>
                </OverlayTrigger>
            </ButtonGroup>
        </ButtonToolbar>;
    }

}
