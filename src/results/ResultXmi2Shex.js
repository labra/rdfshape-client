import PropTypes from "prop-types";
import React, { Fragment, useEffect, useState } from "react";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import API from "../API";
import ByText from "../components/ByText";
import { Permalink } from "../Permalink";
import { shumlexCytoscapeStyle } from "../utils/cytoscape/cytoUtils";
import PrintJson from "../utils/PrintJson";
import { scrollToResults, yasheResultButtonsOptions } from "../utils/Utils";
import ShowVisualization, {
  visualizationTypes
} from "../visualization/ShowVisualization";
const cyto = require("cytoscape");
let dagre = require("cytoscape-dagre");
let svg = require("cytoscape-svg");
let panzoom = require("cytoscape-panzoom");

let cy = null;

function ResultXMI2ShEx({
  result: conversionResult,
  resultMode,
  initialTab,
  permalink,
  disabled,
}) {
  const { result: resultRaw, graph: resultGraph } = conversionResult;

  const [activeTab, setActiveTab] = useState(initialTab);

  const [cytoVisual, setCytoVisual] = useState(null);

  useEffect(scrollToResults, []);

  // Forcibly render the cyto when entering the tab for accurate dimensions
  function renderCytoVisual() {
    setCytoVisual(
      <ShowVisualization
        data={{
          elements: resultGraph,
          stylesheet: shumlexCytoscapeStyle,
        }}
        type={visualizationTypes.cytoscape}
        raw={false}
        controls={true}
        embedLink={false}
        disabledLinks={disabled}
      />
    );
  }

  function handleTabChange(e) {
    setActiveTab(e);
  }

  if (conversionResult)
    return (
      <div id={API.resultsId}>
        <Tabs activeKey={activeTab} id="dataTabs" onSelect={handleTabChange}>
          <Tab eventKey={API.tabs.shex} title={API.texts.misc.shex}>
            {resultRaw && (
              <ByText
                textAreaValue={resultRaw}
                textFormat={API.formats.shexc} // Force ShExC for the text results
                fromParams={false}
                handleByTextChange={function(val) {
                  return val;
                }}
                options={{ ...yasheResultButtonsOptions }}
              />
            )}
          </Tab>
          <Tab
            eventKey={API.tabs.visualization}
            title={API.texts.misc.graph}
            onEnter={renderCytoVisual}
          >
            {cytoVisual}
          </Tab>
        </Tabs>
        <details>
          <summary>{API.texts.responseSummaryText}</summary>
          <PrintJson json={conversionResult} />
        </details>
        {permalink && (
          <Fragment>
            <hr />
            <Permalink url={permalink} disabled={disabled} />
          </Fragment>
        )}
      </div>
    );
}

ResultXMI2ShEx.propTypes = {
  result: PropTypes.object,
  resultMode: PropTypes.string,
  initialTab: PropTypes.string,
};

ResultXMI2ShEx.defaultProps = {
  resultMode: API.formats.turtle, // Mode of the result textArea
  initialTab: API.tabs.shex, // Key of the initially active tab
};

export default ResultXMI2ShEx;
