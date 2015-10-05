/*
 * When adding buttons to the bottom of a Bootstrap alert,
 * you typically want those buttons to
 *   - be right-aligned;
 *   - not be flush up against the text they're below; and
 *   - not be flush up against each other.
 *
 * Unfortunately, these are not the default settings, because
 *   - right-alignment isn't the default;
 *   - there's no margin by default; and
 *   - React strips spaces between DOM components.
 *
 * This file provides two classes, AlertButtonToolbar and AlertButton.
 * AlertButtonToolbar fixes the alignment and vertical margin issues;
 * AlertButton fixes the horizontal margin issue (the third one in the list).
 *
 * You can use this like you use any other React Bootstrap components.
 * Any props you pass to them will be passed straight through,
 * except for "style", which may be modified.
 */
import React, {Component} from 'react';

import {Button} from 'react-bootstrap';

export class AlertButtonToolbar extends Component {

    render() {
        const style = {
            marginTop: 15,
            textAlign: "right",
            ...this.props.style,
        };
        return <div role="toolbar" {...this.props} style={style}>
            {this.props.children}
        </div>;
    }

}

export class AlertButton extends Component {

    render() {
        const style = {
            marginLeft: 5,
            ...this.props.style,
        };
        return <Button {...this.props} style={style}>
            {this.props.children}
        </Button>;
    }

}
