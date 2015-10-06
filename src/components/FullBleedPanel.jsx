/*
 * Like a stripped-down version of react-bootstrap's Panel class,
 * but doesn't include the <div className="panel-body"> around its children
 * because that div adds padding that we don't always want.
 */

import React, {PropTypes, Component} from 'react';

export default class FullBleedPanel extends Component {

    render() {
        return <div className="panel panel-default">
            {this.props.header &&
                <div className="panel-heading">{this.props.header}</div>}
            {this.props.children}
            {this.props.footer &&
                <div className="panel-footer">{this.props.footer}</div>}
        </div>;
    }

}

FullBleedPanel.propTypes = {
    header: PropTypes.node,
    footer: PropTypes.node,
};
