var map;

var markers = [];
var polygon = null;

function initMap() {

    var styles = [{
        "featureType": "administrative",
        "stylers": [{
            "visibility": "off"
        }]
    }, {
        "featureType": "poi",
        "stylers": [{
            "visibility": "simplified"
        }]
    }, {
        "featureType": "road",
        "stylers": [{
            "visibility": "simplified"
        }]
    }, {
        "featureType": "water",
        "stylers": [{
            "visibility": "simplified"
        }]
    }, {
        "featureType": "transit",
        "stylers": [{
            "visibility": "simplified"
        }]
    }, {
        "featureType": "landscape",
        "stylers": [{
            "visibility": "simplified"
        }]
    }, {
        "featureType": "road.highway",
        "stylers": [{
            "visibility": "off"
        }]
    }, {
        "featureType": "road.local",
        "stylers": [{
            "visibility": "on"
        }]
    }, {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [{
            "visibility": "on"
        }]
    }, {
        "featureType": "water",
        "stylers": [{
            "color": "#84afa3"
        }, {
            "lightness": 52
        }]
    }, {
        "stylers": [{
            "saturation": -77
        }]
    }, {
        "featureType": "road"
    }];
    // creates a new map
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 26.09951,
            lng: -80.38377
        },
        zoom: 16,
        styles: styles,
        mapTypeControl: false
    });

    // There are the listings that will be shown
    var locations = [{
            title: 'Starbucks',
            location: {
                lat: 26.097046,
                lng: -80.381578
            }
        }, {
            title: 'Graciano',
            location: {
                lat: 26.097359,
                lng: -80.381417
            }
        }, {
            title: 'Japan Inn',
            location: {
                lat: 26.097205,
                lng: -80.379465
            }
        }, {
            title: 'Duffy',
            location: {
                lat: 26.096121,
                lng: -80.379753
            }
        }, {
            title: 'Yougart Land',
            location: {
                lat: 26.097740,
                lng: -80.381343
            }
        }

    ];

    var largeInfowindow = new google.maps.InfoWindow();

    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_LEFT,
            drawingModes: [
                google.maps.drawing.OverlayType.POLYGON
            ]
        }
    });

    var defaultIcon = makeMarkerIcon('0091ff');

    var highlightedIcon = makeMarkerIcon('ffff24');

    for (var i = 0; i < locations.length; i++) {
        var position = locations[i].location;
        var title = locations[i].title;

        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            icon: defaultIcon,
            animation: google.maps.Animation.DROP,
            id: i
        });

        markers.push(marker);

        marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
        });

        marker.addListener('mouseover', function() {
            this.setIcon(highlightedIcon);
        });
        marker.addListener('mouseout', function() {
            this.setIcon(defaultIcon)
        });


        document.getElementById('show-listings').addEventListener('click', showListings);
        document.getElementById('hide-listings').addEventListener('click', hideListings);

        document.getElementById('toggle-drawing').addEventListener('click', function() {
            toggleDrawing(drawingManager);
        });

        drawingManager.addListener('overlaycomplete', function(event) {
            var polygonArea = google.maps.geometry.spherical.computeArea(polygon.getPath());
            window.alert(polygonArea + "SQUARE METERS");
        });

        document.getElementById('zoom-to-area').addEventListener(click, function() {
            zoomToArea();
        })

        drawingManager.addListener('overlaycomplete', function(event) {

            if (polygon) {
                polygon.setMap(null);
                hideListings();
            }


            drawingManager.setDrawingMode(null);

            polygon = event.overlay;
            polygon.setEditable(true);

            searchWithinPolygon();

            polygon.getPath().addListener('set_at', searchWithinPolygon);
            polygon.getPath().addListener('insert_at', searchWithinPolygon);

        });
    }
}

function populateInfoWindow(marker, infowindow) {
    if (infowindow.marker != marker) {
        infowindow.setContent('');
        infowindow.marker = marker;
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        })


        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;

        function getStreetView(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(nearStreetViewLocation, marker.position);
                infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
                var panoramaOptions = {
                    postion: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 30
                    }
                };
                var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);
            } else {
                infowindow.setContent('<div>' + marker.title + '</div>' +
                    '<div>No Street View Found</div>');
            }
        }

        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        infowindow.open(map, marker);
    }
}

function showListings() {
    var bounds = new google.maps.LatLngBounds();

    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}


function zoomToArea() {
    var geocoder = new google.maps.Geocoder();

    var address = document.getElementById('zoom-to-area-text').value
    if (address == ' ') {
        window.alert('You must enter a place, or address');
    } else {
        geocoder.geocode({
            address: address
        },function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location);
                map.setZoom(15);
            } else {
                window.alert('We could not find that location');
            }
        });
    }
}

function hideListings() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
}

function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor + '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}

function toggleDrawing(drawingManager) {
    if (drawingManager.map) {
        drawingManager.setMap(null);
        if (polygon) {
            polygon.setMap(null);
        }
    } else {
        drawingManager.setMap(map);
    }
}

function searchWithinPolygon() {
    for (var i = 0; i < markers.length; i++) {
        if (google.maps.geometry.poly.containsLocation(markers[i].position, polygon)) {

            markers[i].setMap(map);
        } else {
            markers[i].setMap(null);
        }
    }
}
