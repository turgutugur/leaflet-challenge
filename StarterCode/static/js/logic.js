// create the tile layers for the backgrounds of the map
var defaultMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// grayscale layer
var grayscale = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});

// topographic layer
var topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// make a basemaps object
let basemaps = {
    Default: defaultMap,
    GrayScale: grayscale,
    Topographic: topo
}


// create a map object
var myMap = L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 3,
    layers: [defaultMap, grayscale, topo]

});

// add the default map to the map
defaultMap.addTo(myMap);

// get the data for the tectonic plates and draw on the map
// variable to hold the tectonic plates layer
let tectonicplates = new L.layerGroup();

// call the API to get the info for the tectonic plates
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
.then(function(plateData){
    // console log to make sure the data loaded in console 
    // console.log(plateData)

    // load the data using geoJson and add to the textonic plates layer
    L.geoJson(plateData, {
        // add styling
        color: "yellow",
        weight: 1
    }).addTo(tectonicplates);
});

// add tectonic plates to the map
tectonicplates.addTo(myMap);

// variable to hold the earthquake data layer
let earthquakes = new L.layerGroup();

// get the data for the earthquakes and populate the layer group 
// call the USGS GeoJson API
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
.then(function(earthquakeData){
        // console log to make sure the data loaded in console 
        // console.log(earthquakeData);
        // plot circles, where the radius is dependent on the magnitude and the color is dependent on the depth 

        // make a function that chooses the color of the data point
        function dataColor(depth){
            if (depth > 90)
                return "red";
            else if (depth > 70)
                return "#fc4903";
            else if (depth > 50)
                return "#fc8403";
            else if (depth > 30)
                return "#fcad03";
            else if (depth > 10)
                return "#cafc03";
            else 
                return "green";
        }

        // make a function to determine the size of radius 
        function radiusSize(mag){
            if (mag == 0)
                return 1; // this makes sure that a Zero mag EQ shows up 
            else
                return mag * 5; // makes sure that circle gets bigger in the map
        }

        // add on to the style for each data points
        function dataStyle(feature){
            return {
                opacity: 5,
                fillOpacity: 0.5,
                fillColor: dataColor(feature.geometry.coordinates[2]), // using index 2 for the depth 
                color: "000000", // outline color
                radius: radiusSize(feature.properties.mag), // grabs the magnitude 
                weight: 0.5,
                stroke: true
            }
        }

        // add the geoJson data to the earthquake layer group 
        L.geoJson(earthquakeData, {
            // make each feature a circle marker on the map
            pointToLayer: function(feature, latLng) {
                return L.circleMarker(latLng);
            },
            // set the style for each marker
            style: dataStyle, 
            // add popups 
            onEachFeature: function(feature, layer){
                layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br> 
                                Depth: <b>${feature.geometry.coordinates[2]}</b><br> 
                                Location: <b>${feature.properties.place}</b>`);
            }
        }).addTo(earthquakes);
    }
);

// add the overlay for the tectonic plates for the earthquakes
let overlay = {
    "Tectonic Plates": tectonicplates,
    "Earthquake Data": earthquakes
};

// add layer control
L.control.layers(basemaps, overlay).addTo(myMap);

// add the legend to the map
let legend = L.control({
    position: "bottomright"
});

// add the properties for the legend 
legend.onAdd = function() {
    // div for the legend to appear in the page
    let div = L.DomUtil.create("div", "info legend");

    // set up the intervals 
    let intervals = [-10, 10, 30, 50, 70, 90];
    // set colors for invervals 
    let colors = [
        "green", "#cafc03", "#fcad03", "#fc8403", "#fc4903", "red"
    ];
    // loop thru the intervals and colors then generate a label with a colored square for each interval
    for(var i = 0; i < intervals.length; i++)
    {
        // inner html that sets the square for each interval and label
        div.innerHTML += "<i style='background: " + colors[i] + "'></i> "
            + intervals[i] + (intervals[i + 1] ? "&ndash;" + intervals[i + 1] + "<br>" : "+");
    }
    return div; 
};

// add the legend to the map
legend.addTo(myMap);
