import axios from "axios";
import qs from "query-string";
import React, { Fragment, useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import ProgressBar from "react-bootstrap/ProgressBar";
import Row from "react-bootstrap/Row";
import { ZoomInIcon, ZoomOutIcon } from "react-open-iconic-svg";
import API from "../API";
import { mkPermalinkLong, params2Form, Permalink } from "../Permalink";
import { processDotData } from "../utils/dot/dotUtils";
import { mkError } from "../utils/ResponseError";
import {
  visualizationMaxZoom,
  visualizationMinZoom,
  visualizationStepZoom
} from "../utils/Utils";
import ShowVisualization, {
  visualizationTypes
} from "../visualization/ShowVisualization";
import VisualizationLinks from "../visualization/VisualizationLinks";
import {
  getDataText,
  InitialData,
  mkDataTabs,
  paramsFromStateData,
  updateStateData
} from "./Data";
import { mkServerParams } from "./DataMerge";

function DataMergeVisualize(props) {
  const [data1, setData1] = useState(InitialData);
  const [data2, setData2] = useState(InitialData);
  // The server internally converts to DOT and the client interprets that DOT as the user needs it (SVG, PNG...)
  const [dataTargetFormat] = useState(API.formats.dot);

  const [params, setParams] = useState(null);
  const [lastParams, setLastParams] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [permalink, setPermalink] = useState(null);
  const [embedLink, setEmbedLink] = useState(null);
  const [visualization, setVisualization] = useState(null);
  const [svgZoom, setSvgZoom] = useState(1);
  const [progressPercent, setProgressPercent] = useState(0);

  const [disabledLinks, setDisabledLinks] = useState(false);

  const url = API.routes.server.dataConvert;

  const minSvgZoom = visualizationMinZoom;
  const maxSvgZoom = visualizationMaxZoom;
  const svgZoomStep = visualizationStepZoom;

  useEffect(() => {
    if (props.location?.search) {
      const queryParams = qs.parse(props.location.search);
      if (queryParams[API.queryParameters.data.compound]) {
        try {
          const contents = JSON.parse(
            queryParams[API.queryParameters.data.compound]
          );

          const newData1 = updateStateData(contents[0], data1) || data1;
          const newData2 = updateStateData(contents[1], data2) || data2;
          setData1(newData1);
          setData2(newData2);

          const params = mkParams(newData1, newData2);
          setParams(params);
          setLastParams(params);
        } catch {
          setError(API.texts.errorParsingUrl);
        }
      } else {
        setError(API.texts.errorParsingUrl);
      }
    }
  }, [props.location?.search]);

  useEffect(() => {
    if (params && params[API.queryParameters.data.compound]) {
      const parameters = JSON.parse(params[API.queryParameters.data.compound]);
      if (parameters.some((p) => p[API.queryParameters.data.data])) {
        // Check if some data was uploaded
        resetState();
        setUpHistory();
        postVisualize();
      } else {
        setError(API.texts.noProvidedRdf);
      }
      window.scrollTo(0, 0);
    }
  }, [params]);

  async function handleSubmit(event) {
    event.preventDefault();
    setParams(mkParams());
  }

  function mkParams(data1Params = data1, data2Params = data2) {
    const finalDataParams = [
      paramsFromStateData(data1Params),
      paramsFromStateData(data2Params),
    ];

    return {
      [API.queryParameters.data.compound]: JSON.stringify(finalDataParams),
      [API.queryParameters.data.targetFormat]: dataTargetFormat,
    };
  }

  async function postVisualize(cb) {
    setLoading(true);
    setProgressPercent(15);

    const serverParams = await mkServerParams(data1, data2, dataTargetFormat);
    if (!serverParams) {
      resetState();
      setError(API.texts.noProvidedRdf);
      return;
    }

    const formData = params2Form(serverParams);
    setProgressPercent(35);

    axios
      .post(url, formData)
      .then((response) => response.data)
      .then(async (data) => {
        setProgressPercent(70);
        const dot = data.result.data; // Get the DOT string from the axios data object
        processDotData(dot, setError, setVisualization);
        setPermalink(
          mkPermalinkLong(API.routes.client.dataMergeVisualizeRoute, params)
        );
        setEmbedLink(
          mkPermalinkLong(API.routes.client.dataMergeVisualizeRouteRaw, params)
        );
        setProgressPercent(80);
        checkLinks();
        if (cb) cb();
        setProgressPercent(100);
      })
      .catch(function(error) {
        setError(mkError(error, url));
      })
      .finally(() => {
        setLoading(false);
        window.scrollTo(0, 0);
      });
  }

  // Disabled permalinks, etc. if the user input is too long or a file
  function checkLinks() {
    const disabled =
      getDataText(data1).length + getDataText(data2).length >
      API.limits.byTextCharacterLimit
        ? API.sources.byText
        : data1.activeSource === API.sources.byFile ||
          data2.activeSource === API.sources.byFile
        ? API.sources.byText
        : false;

    setDisabledLinks(disabled);
  }

  function zoomSvg(zoomIn) {
    if (zoomIn) {
      const zoom = Math.min(maxSvgZoom, svgZoom + svgZoomStep);
      setSvgZoom(zoom);
    } else {
      const zoom = Math.max(minSvgZoom, svgZoom - svgZoomStep);
      setSvgZoom(zoom);
    }
  }

  function setUpHistory() {
    // Store the last search URL in the browser history to allow going back
    if (
      params &&
      lastParams &&
      JSON.stringify(params) !== JSON.stringify(lastParams)
    ) {
      // eslint-disable-next-line no-restricted-globals
      history.pushState(
        null,
        document.title,
        mkPermalinkLong(API.routes.client.dataMergeVisualizeRoute, lastParams)
      );
    }
    // Change current url for shareable links
    // eslint-disable-next-line no-restricted-globals
    history.replaceState(
      null,
      document.title,
      mkPermalinkLong(API.routes.client.dataMergeVisualizeRoute, params)
    );

    setLastParams(params);
  }

  function resetState() {
    setVisualization(null);
    setSvgZoom(1);
    setPermalink(null);
    setError(null);
    setLoading(false);
    setProgressPercent(0);
  }

  return (
    <Container fluid={true}>
      <Row>
        <h1>{API.texts.pageHeaders.dataMergeVisualize}</h1>
      </Row>
      <Row>
        <Col className={"half-col border-right"}>
          <Form onSubmit={handleSubmit}>
            {mkDataTabs(data1, setData1, "RDF input (1)")}
            <hr />
            {mkDataTabs(data2, setData2, "RDF input (2)")}
            <hr />
            <Button
              id="submit"
              variant="primary"
              type="submit"
              className={"btn-with-icon " + (loading ? "disabled" : "")}
              disabled={loading}
            >
              Merge & visualize
            </Button>
          </Form>
        </Col>
        {loading || error || visualization ? (
          <Col className="half-col visual-column">
            <Fragment>
              {permalink && !error ? (
                <div className={"d-flex"}>
                  <Permalink url={permalink} disabled={disabledLinks} />
                  {!visualization?.textual && (
                    <>
                      <div className="divider"></div>
                      <Button
                        onClick={() => zoomSvg(false)}
                        className="btn-zoom"
                        variant="secondary"
                        disabled={svgZoom <= minSvgZoom}
                      >
                        <ZoomOutIcon className="white-icon" />
                      </Button>
                      <Button
                        onClick={() => zoomSvg(true)}
                        style={{ marginLeft: "1px" }}
                        className="btn-zoom"
                        variant="secondary"
                        disabled={svgZoom >= maxSvgZoom}
                      >
                        <ZoomInIcon className="white-icon" />
                      </Button>
                    </>
                  )}
                </div>
              ) : null}

              {loading ? (
                <ProgressBar
                  striped
                  animated
                  variant="info"
                  now={progressPercent}
                />
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : visualization && visualization.data ? (
                <div
                  style={{ position: "relative" }}
                  className="width-100 height-100 border"
                >
                  <VisualizationLinks
                    generateDownloadLink={() => {}} // generateDownloadLink(visualization)}
                    embedLink={embedLink}
                    disabled={disabledLinks}
                  />

                  <div
                    style={{ overflow: "auto" }}
                    className={"width-100 height-100"}
                  >
                    <ShowVisualization
                      data={visualization.data}
                      type={visualizationTypes.svgObject}
                      raw={false}
                      zoom={svgZoom}
                      embedLink={embedLink}
                      disabledLinks={disabledLinks}
                    />
                  </div>
                </div>
              ) : null}
            </Fragment>
          </Col>
        ) : (
          <Col className={"half-col"}>
            <Alert variant="info">{API.texts.mergeResultsWillAppearHere}</Alert>
          </Col>
        )}
      </Row>
    </Container>
  );
}

export default DataMergeVisualize;
