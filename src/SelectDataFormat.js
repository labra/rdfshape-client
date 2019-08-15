import React from 'react';
import Form from "react-bootstrap/Form";
import axios from 'axios';
import ServerHost from "./ServerHost"

class SelectDataFormat extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            formats: [],
            dataFormat: this.props.defaultDataFormat
        }
        this.handleDataFormatChange = this.handleDataFormatChange.bind(this);
    }

    handleDataFormatChange(e) {
        console.log(e.target.value);
        this.setState({dataFormat: e.target.value})
        this.props.handleDataFormatChange(e.target.value);
    }

    componentDidMount() {
        const url = ServerHost() + "/api/data/formats";
        axios.get(url).then(response => response.data)
            .then((data) => {
                this.setState({ formats: data })
                console.log(this.state.formats)
            })
    }

    render() {
        return (
            <Form.Group>
            <Form.Label>{this.props.name}</Form.Label>
            <Form.Control as="select" onChange={this.handleDataFormatChange}>
                { this.state.formats.map((format,key) => (
                    <option key={key}>{format}</option>
                 ))
                }
            </Form.Control>
            </Form.Group>
        )
    }
}

export default SelectDataFormat;
