import React, { Fragment, useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import API from "../API";
import { Permalink } from "../Permalink";
import ShowShapeMap from "../shapeMap/ShowShapeMap";
import PrintJson from "../utils/PrintJson";
import { equalsIgnoreCase } from "../utils/Utils";

export const conformant = "conformant"; // Status of conformant nodes
export const nonConformant = "nonconformant"; // Status of non-conformant nodes

function ResultSchemaValidate({
  result: schemaValidateResponse, // Request successful response
  permalink,
  disabled,
}) {
  const {
    message,
    data,
    schema,
    trigger,
    result: {
      shapeMap: resultsMap,
      resultErrors,
      nodesPrefixMap,
      shapesPrefixMap,
    },
  } = schemaValidateResponse;

  // Store the resulting nodes in state, plus the invalid ones
  const [nodes] = useState(resultsMap);
  const [invalidNodes, setInvalidNodes] = useState([]);

  // Update invalid nodes on node changes
  useEffect(() => {
    const nonConformantNodes = nodes.filter((node) =>
      equalsIgnoreCase(node.status, nonConformant)
    );
    setInvalidNodes(nonConformantNodes);
  }, [nodes]);

  if (schemaValidateResponse) {
    return (
      <div>
        {/* Place an alert depending on the validation errors */}
        {!nodes?.length ? ( // No results but the server returns a successful code
          <Alert variant="warning">{API.texts.validationResults.noData}</Alert>
        ) : invalidNodes.length == 0 ? ( // No invalid nodes among the results
          <Alert variant="success">
            {API.texts.validationResults.allValid}
          </Alert>
        ) : invalidNodes.length == nodes.length ? ( // All invalid nodes
          <Alert variant="danger">
            {API.texts.validationResults.noneValid}
          </Alert>
        ) : (
          // Some invalid nodes
          <Alert variant="warning">
            {API.texts.validationResults.someValid}
          </Alert>
        )}
        {permalink && (
          <Fragment>
            <Permalink url={permalink} disabled={disabled} />
            <hr />
          </Fragment>
        )}
        {nodes?.length && (
          <ShowShapeMap
            shapeMap={resultsMap}
            nodesPrefixMap={nodesPrefixMap}
            shapesPrefixMap={shapesPrefixMap}
          />
        )}

        <details>
          <summary>{API.texts.responseSummaryText}</summary>
          <PrintJson json={schemaValidateResponse} />
        </details>
      </div>
    );
  }
}

export default ResultSchemaValidate;
