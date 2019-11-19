import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import 'javascript-autocomplete/auto-complete.css';
import * as olProj from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import Vector from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Stamen from 'ol/source/Stamen';
import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {
  // eslint-disable-next-line no-unused-vars
  apply
} from 'ol-mapbox-style';
import AutoComplete from 'javascript-autocomplete';

// Karte - design + Lage beim aufmachen
const map = new Map({
  layers: [
    new TileLayer({
      source: new Stamen({
        layer: 'terrain'
      })
    })
  ],
  target: 'map',
  view: new View({
    center: olProj.fromLonLat([16.372, 48.209]),
    zoom: 12
  })
});

// Suchfelder
function fit() {
  map.getView().fit(source.getExtent(), {
    maxZoom: 19,
    duration: 250
  });
}

let selected;

function getAddress(feature) {
  const properties = feature.getProperties();
  return (
    (properties.city || properties.name || '') +
    ' ' +
    (properties.street || '') +
    ' ' +
    (properties.housenumber || '')
  );
}

const searchResult = new VectorLayer({
  zIndex: 9999
});
map.addLayer(searchResult);

let onload, source;
new AutoComplete({
  selector: 'input[name="q"]',
  source: function (term, response) {
    if (onload) {
      source.un('change', onload);
    }
    searchResult.setSource(null);
    source = new VectorSource({
      format: new GeoJSON(),
      url: 'https://photon.komoot.de/api/?q=' + term
    });
    onload = function (e) {
      const texts = source.getFeatures().map(function (feature) {
        return getAddress(feature);
      });
      response(texts);
      fit();
    };
    source.once('change', onload);
    searchResult.setSource(source);
  },
  onSelect: function (e, term, item) {
    selected = item.getAttribute('data-val');
    source.getFeatures().forEach(function (feature) {
      if (getAddress(feature) !== selected) {
        source.removeFeature(feature);
      }
    });
    fit();
  }
});

// layer mit Bezirksgrenzen (gefällt mir nicht ganz - kann man löschen)
const bezirkeLayer = new VectorLayer({
  source: new Vector({
    url: 'https://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=1.1.0&typeName=ogdwien:BEZIRKSGRENZEOGD&srsName=EPSG:4326&outputFormat=json',
    format: new GeoJSON()
  })
});
map.addLayer(bezirkeLayer);

bezirkeLayer.setStyle(function (feature) {
  let fillColor;
  const feedbackCount = feature.get('FEEDBACKS');
  if (feedbackCount <= 100) {
    fillColor = 'rgba(247, 252, 185, 0)';
  } else {
    fillColor = 'rgba(49, 163, 84, 0.2)';
  }
  return new Style({
    fill: new Fill({
      color: fillColor
    }),
    stroke: new Stroke({
      color: 'rgba(4,100,122, 1)',
      width: 2
    })
  });
});