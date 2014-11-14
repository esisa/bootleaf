var map, featureList, boroughSearch = [], theaterSearch = [], museumSearch = [];

var routeAlternatives;
var geometry;
var marker;
var viaMarker1, viaMarker2;

$(document).on("click", ".feature-row", function(e) {
  sidebarClick(parseInt($(this).attr("id"), 10));
});

$("#about-btn").click(function() {
  $("#aboutModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#full-extent-btn").click(function() {
  map.fitBounds(boroughs.getBounds());
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#legend-btn").click(function() {
  $("#legendModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#login-btn").click(function() {
  $("#loginModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#list-btn").click(function() {
  $('#sidebar').toggle();
  map.invalidateSize();
  return false;
});

$("#nav-btn").click(function() {
  $(".navbar-collapse").collapse("toggle");
  return false;
});

$("#sidebar-toggle-btn").click(function() {
  $("#sidebar").toggle();
  map.invalidateSize();
  return false;
});

$("#sidebar-hide-btn").click(function() {
  $('#sidebar').hide();
  map.invalidateSize();
});

function sidebarClick(id) {
  map.addLayer(theaterLayer).addLayer(museumLayer);
  var layer = markerClusters.getLayer(id);
  markerClusters.zoomToShowLayer(layer, function() {
    map.setView([layer.getLatLng().lat, layer.getLatLng().lng], 17);
    layer.fire("click");
  });
  /* Hide sidebar and go to the map on small screens */
  if (document.body.clientWidth <= 767) {
    $("#sidebar").hide();
    map.invalidateSize();
  }
}



/* Basemap Layers */
var turkompisenSki = L.tileLayer("http://kart1.turkompisen.no/cache/skikart/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: 'Turkompisen.no'
});
var turkompisenTur = L.tileLayer("http://kart1.turkompisen.no/cache/turkart/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: 'Turkompisen.no'
});
var kartverket = new L.TileLayer("http://kart1.turkompisen.no/cache/turkart_kartverket/{z}/{x}/{y}.png", {
    subdomains: ["1", "2", "3", "4"],
    //scheme: "tms",
    maxZoom: 18
});


map = L.map("map", {
  zoom: 12,
  center: [59.74289, 10.19712],
  layers: [turkompisenSki],
  zoomControl: false,
  attributionControl: false
});

map.on('click', function(e){
    if (typeof marker != "undefined") {
      map.removeLayer(marker);
    }
    
    marker = new L.marker(e.latlng).addTo(map);
    createRoutes(e.latlng.lat, e.latlng.lng);
});


var zoomControl = L.control.zoom({
  position: "bottomright"
}).addTo(map);

/* GPS enabled geolocation control set to follow the user's location */
var locateControl = L.control.locate({
  position: "bottomright",
  drawCircle: true,
  follow: true,
  setView: true,
  keepCurrentZoomLevel: true,
  markerStyle: {
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.8
  },
  circleStyle: {
    weight: 1,
    clickable: false
  },
  icon: "icon-direction",
  metric: false,
  strings: {
    title: "My location",
    popup: "You are within {distance} {unit} from this point",
    outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
  },
  locateOptions: {
    maxZoom: 18,
    watch: true,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 10000
  }
}).addTo(map);

/* Larger screens get expanded layer control and visible sidebar */
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
}

var baseLayers = {
  "Turkompisen OSM Tur": turkompisenTur,
  "Turkompisen OSM Ski": turkompisenSki,
  "Kartverket": kartverket
};

var overlayMaps = {
    "Rute": geojson
};

var layerSwitcher = L.control.layers(baseLayers).addTo(map);
/*
var layerControl = L.control.groupedLayers(baseLayers, {
  collapsed: isCollapsed
}).addTo(map);
*/
function searchPlace() {
  createRoutes(lat, lng);
}

function createRoutes(lat, lng) {

  // Delete old routes
  $('#routeSuggestions').empty();

  // Delete map objects
  if (typeof geojson != "undefined") {
    geojson.clearLayers();
    map.removeLayer(viaMarker1);
    map.removeLayer(viaMarker2);
  }

  var opts = {
  lines: 11, // The number of lines to draw
  length: 7, // The length of each line
  width: 3, // The line thickness
  radius: 10, // The radius of the inner circle
  corners: 1, // Corner roundness (0..1)
  rotate: 0, // The rotation offset
  direction: 1, // 1: clockwise, -1: counterclockwise
  color: '#000', // #rgb or #rrggbb or array of colors
  speed: 1, // Rounds per second
  trail: 60, // Afterglow percentage
  shadow: false, // Whether to render a shadow
  hwaccel: false, // Whether to use hardware acceleration
  className: 'spinner', // The CSS class to assign to the spinner
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  top: '50%', // Top position relative to parent
  left: '30%' // Left position relative to parent
};
  var target = document.getElementById('routeSuggestions');
  var spinner = new Spinner(opts).spin(target);

  /* Search for possible routes */
  /*$.getJSON( "assets/js/routeAlternativeDemo.json", function( data ) {
    routeAlternatives = data;
  });*/

 /*
  $.getJSON( "http://localhost:5000/59.817737462544024/10.020432472229004", function( data ) {
    routeAlternatives = data;

    $.each(routeAlternatives, function( index, route ) {
      console.log( index + ": " + route.lineArea );
      var num = index+1;
      $('#routeSuggestions').append('<p><button type="button" class="btn btn-primary" data-sort="feature-name" onClick="showRoute('+index+')">Turforslag '+num+'</button></p>');
    });

  });
*/

  
  $.getJSON( "http://localhost:5000/circularRoute/"+ lat + "/" + lng + "/" + $('#routeLength').val(), function( data ) {
    routeAlternatives = data;

    spinner.stop();

    if(routeAlternatives.length>0) {
      $.each(routeAlternatives, function( index, route ) {
        //console.log( index + ": " + route.lineArea );
        var num = index+1;
        var routeLength = (route.distance/1000).toFixed(1);
        var lineAreaPerLength = (route.lineAreaPerLength).toFixed(4);
        $('#routeSuggestions').append('<p><button type="button" class="btn btn-primary" data-sort="feature-name" onClick="showRoute('+index+')">Lengde: '+routeLength+' Area per length: '+lineAreaPerLength+'</button></p>');
      });
    }
    else {
      $('#routeSuggestions').append('<h3>Fant ingen turer!</h3>');
    }
  });



  

  

    // Get lengde, type of route 
    // Jquery stuff

    // Search routes from flask

    // List ten routes in sidebar

    // Show route in map when clicking the route in the sidebar


  $('#routeSuggestions').show();
}

var geojson;
function showRoute(num) {
  startPoint = "&loc=" + routeAlternatives[num].startPoint[0] + "," + routeAlternatives[num].startPoint[1];
  endPoint = "&loc=" + routeAlternatives[num].endPoint[0] + "," + routeAlternatives[num].endPoint[1];
  viaPoint1 = "&loc=" + routeAlternatives[num].viaPoint1[0] + "," + routeAlternatives[num].viaPoint1[1];
  viaPoint2 = "&loc=" + routeAlternatives[num].viaPoint2[0] + "," + routeAlternatives[num].viaPoint2[1];



  var url = "http://178.62.235.179:8081/viaroute?z=18&output=json"+startPoint+viaPoint1+viaPoint2+endPoint+"&instructions=true";

  $.getJSON( url, function( data ) {
    geometry = parseGeometry(data.route_geometry, 6);



    var routeLineString = [{
        "type": "LineString",
        "coordinates": geometry
    }];

    var myLines = [{
        "type": "LineString",
        "coordinates": [[-100, 40], [-105, 45], [-110, 55]]
    }, {
        "type": "LineString",
        "coordinates": [[10, 60], [11, 60], [12, 60]]
    }];

    var myStyle = {
        "color": "#ff7800",
        "weight": 5,
        "opacity": 0.65
    };

    if (typeof geojson != "undefined") {
      geojson.clearLayers();
      map.removeLayer(viaMarker1);
      map.removeLayer(viaMarker2);
    }
    

    geojson = L.geoJson(routeLineString, {
        style: myStyle
    });

    map.addLayer(geojson);
    var overlayMaps = {
        "Rute": geojson
    };
    layerSwitcher.addOverlay(overlayMaps);

    // Add via markers
    viaMarker1 = new L.marker([routeAlternatives[num].viaPoint1[0], routeAlternatives[num].viaPoint1[1]]).addTo(map);
    //viaMarker1.bindPopup("Viapunkt 1").openPopup();
    viaMarker2 = new L.marker([routeAlternatives[num].viaPoint2[0], routeAlternatives[num].viaPoint2[1]]).addTo(map);
    //viaMarker2.bindPopup("Viapunkt 2").openPopup();

    map.fitBounds(geojson.getBounds())
  });
  
}

function parseGeometry(encoded, precision) {
  precision = Math.pow(10, -precision);
  var len = encoded.length, index=0, lat=0, lng = 0, array = [];
  while (index < len) {
    var b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    //array.push( {lat: lat * precision, lng: lng * precision} );
    array.push( [lng * precision, lat * precision ] );
  }
  return array;
}


