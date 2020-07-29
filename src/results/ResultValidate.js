import React, {Fragment} from 'react';
import Alert from "react-bootstrap/Alert";
import ShowShapeMap from "../shapeMap/ShowShapeMap";
import {Permalink} from "../Permalink";

function ResultValidate(props) {

    let result = props.result
    let msg
    if (result === "") {
        msg = null
    } else
    if (result.error) {
        msg =
            <div><Alert variant="danger">Error: {result.error}</Alert></div>
    } else {
        console.log("RESULTS: ", result)
        msg = <div>
            { result.errors.length > 0 ?
                <Alert variant="danger">Partially invalid data: check the details of each node to learn more</Alert> :
                result.message && <Alert variant="success">{result.message} </Alert>
            }
            {/*{ result.errors && <div> { result.errors.map((e,idx) => <Alert id={idx} variant="danger">{e.type}: {e.error}</Alert> )}</div>}*/}
            {result.shapeMap.length === 0 && <Alert variant="info">
                Validation was successful but no results were obtained, check the if the input data is coherent</Alert>}
            { props.permalink && result.errors.length === 0 &&
            <Fragment>
                <Permalink url={props.permalink}/>
                <hr/>
            </Fragment>
            }
            { result.shapeMap && result.shapeMap.length > 0 && <ShowShapeMap
                shapeMap={result.shapeMap}
                nodesPrefixMap={result.nodesPrefixMap}
                shapesPrefixMap={result.shapesPrefixMap}
            /> }
            <details><p className="word-break">{JSON.stringify(result)}</p></details>
        </div>
    }

     return (
         <div>{msg}</div>
     );
}

export default ResultValidate
