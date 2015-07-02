/* This program is free software: you can redistribute it and/or
   modify it under the terms of the GNU Lesser General Public License
   as published by the Free Software Foundation, either version 3 of
   the License, or (at your option) any later version.
   
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   
   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>. 
 */

otp.namespace("otp.client");

otp.client.Gui = otp.Class({

    /**
     * Constructor.
     */
    initialize : function(config, poisSource, geocoder) {

        var thisGu = this;
        this.config = config;
        this.mode = config.mode;
        this.poisSource = poisSource;
        this.geocoder = geocoder;
        this.poisSource.onLoad(function() {
            if (thisGu.timegrid && thisGu.timegrid.isLoaded())
                thisGu._refreshPois();
        });

        /* Initialize a leaflet map */
        this.map = L.map('map', {
            minZoom : 12,
            maxZoom : 18
        }).setView(this.config.origin, this.config.zoom);

        /* Create a tile layer with mapbox */
        this.mapboxLayer = new L.TileLayer("https://{s}.tiles.mapbox.com/v4/loranger.map-hu1qhmlo/{z}/{x}/{y}.png"
                + "?access_token=" + this.config.mapToken, {
            maxZoom : this.config.maxZoom
        });
        this.map.addLayer(this.mapboxLayer);

        /* Create layer groups */
        this.isochronesLayerGroup = new L.LayerGroup([]);
        this.poisLayerGroup = new L.LayerGroup([]);
        this.map.addLayer(this.isochronesLayerGroup);
        this.map.addLayer(this.poisLayerGroup);

        /* Add controls to the map */
        L.control.layers({
            "Cartographie" : this.mapboxLayer
        }, {
            "Isochrones" : this.isochronesLayerGroup,
            "Point d'intérêts" : this.poisLayerGroup
        }, {
            position : 'topleft'
        }).addTo(this.map);

        /* Draggable marker */
        this.marker = L.marker(this.config.origin, {
            draggable : true,
            zIndexOffset : 10000
        }).on('dragend', function() {
            if (thisGu.geocoder)
                thisGu.geocoder.reverseGeocode(this.getLatLng());
            thisGu._refresh();
        }).addTo(this.map);

        /* Geocoder callback */
        if (this.geocoder) {
            this.geocoder.onReverseGeocode(function(addr) {
                $("#address").val(addr);
            });
        }

        /* POI icons */
        this.poiSmallIcons = [];
        this.poiBigIcons = [];
        for (var i = 0; i < this.poisSource.getPoiTypes().length; i++) {
            var type = this.poisSource.getPoiTypes()[i];
            this.poiSmallIcons[type] = L.icon({
                iconUrl : "../img/" + type.toLowerCase() + "_mapicon.png",
                shadowUrl : "../img/icon_shadow.png",
                iconSize : [ 14, 20 ],
                shadowSize : [ 20, 9 ],
                iconAnchor : [ 7, 20 ],
                shadowAnchor : [ 6, 9 ],
                popupAnchor : [ 0, -40 ]
            });
            this.poiBigIcons[type] = L.icon({
                iconUrl : "../img/" + type.toLowerCase() + "_mapicon2.png",
                shadowUrl : "../img/icon_shadow2.png",
                iconSize : [ 28, 39 ],
                shadowSize : [ 37, 17 ],
                iconAnchor : [ 14, 39 ],
                shadowAnchor : [ 12, 17 ],
                popupAnchor : [ 0, -40 ]
            });
        }

        /* Legend */
        var maplegend = L.control({
            position : 'bottomleft'
        });
        maplegend.onAdd = function(map) {
            var box = L.DomUtil.create("div", "maplegend");
            box.innerHTML = $("#legend").html();
            $("#legend").remove();
            return box;
        };
        maplegend.addTo(this.map);

        /* Bind mode selector */
        $("input[name=mode]:radio").bind("change", function(event, ui) {
            thisGu.mode = $(this).val();
            thisGu._refresh();
        });

        /* Bind POI type selector */
        this.poiSelect = [];
        for (var i = 0; i < this.poisSource.getPoiTypes().length; i++) {
            var poiType = this.poisSource.getPoiTypes()[i];
            var poiCheckbox = $("input[name=" + poiType + "]:checkbox");
            this.poiSelect[poiType] = poiCheckbox.is(":checked");
            poiCheckbox.bind("change", function(event, ui) {
                thisGu.poiSelect[this.name] = $(this).is(":checked");
                thisGu._refreshPois();
            });
        }

        this._refresh();
    },

    /**
     * To call whenever a parameter (position, mode) have changed.
     */
    _refresh : function() {
        var thisGu = this;
        this.isochronesLayerGroup.clearLayers();
        var params = {
            routerId : this.config.routerid,
            fromPlace : this.marker.getLatLng().lat + ',' + this.marker.getLatLng().lng,
            date : this.config.date,
            time : this.config.time,
            mode : this.mode,
            bikeSpeed : this.config.bikeSpeed,
            precisionMeters : this.config.precisionMeters,
            offRoadDistanceMeters : this.config.offRoadDistanceMeters,
            maxTimeSec : this.config.isotimes[this.config.isotimes.length - 1]
        };
        /* Get the isochrone GeoJSON features from the server */
        this.isochrone = new otp.analyst.Isochrone(params, this.config.isotimes).onLoad(function(iso) {
            thisGu.isochronesLayerGroup.clearLayers();
            for (var i = thisGu.config.isotimes.length - 1; i >= 0; i--) {
                var isotime = thisGu.config.isotimes[i];
                var isoLayer = L.geoJson(iso.getFeature(isotime), {
                    style : {
                        color : "#0000FF",
                        weight : 2,
                        dashArray : (i % 2) == 1 ? "5,4" : "",
                        fillOpacity : 0.1,
                        fillColor : "#000000"
                    }
                });
                // .bindPopup(' < ' + (isotime / 60) + ' mn').on('mouseover',
                // function(e) {
                // e.layer.openPopup();
                // }).on('mouseout', function(e) {
                // e.layer.closePopup();
                // });
                thisGu.isochronesLayerGroup.addLayer(isoLayer);
            }
        });
        /* Get the timegrid from the server */
        this.timegrid = new otp.analyst.TimeGrid(params).onLoad(function(grid) {
            if (thisGu.poisSource && thisGu.poisSource.isLoaded())
                thisGu._refreshPois();
        });
    },

    setPois : function(poisSource) {
        return this;
    },

    _refreshPois : function() {
        var thisGui = this;
        $("#loading").hide();
        $("#noResults").hide();
        this.poisLayerGroup.clearLayers();
        this.pois = [];
        for (var i = 0; i < this.poisSource.getPois().length; i++) {
            var poi = this.poisSource.getPois()[i];
            var val = this.timegrid.get(poi.location);
            poi.t = val ? val.z : Number.POSITIVE_INFINITY;
            if (this.poiSelect[poi.type])
                this.pois.push(poi);
        }
        this.pois.sort(function(a, b) {
            return a.t - b.t;
        });
        var ul = $('#poiList');
        ul.empty();
        var n = 0;
        for (var i = 0; i < this.pois.length; i++) {
            var poi = this.pois[i];
            if (poi.t > 40 * 60)
                break;
            var poiMarker = L.marker(poi.location, {
                icon : this.poiSmallIcons[poi.type],
                draggable : false
            }).addTo(this.poisLayerGroup);
            poiMarker.smallIcon = this.poiSmallIcons[poi.type];
            poiMarker.bigIcon = this.poiBigIcons[poi.type];
            if (n < 20) {
                var li = $('<li>');
                ul.append(li.attr('class', poi.type).append($('<span>').attr('class', 'poi-name').append(poi.name))
                        .append($('<span>').attr('class', 'poi-time').append(this._formatTime(poi.t))));
                li.mouseenter(function(thePoi, theMarker) {
                    return function() {
                        theMarker.openPopup();
                        theMarker.setIcon(theMarker.bigIcon);
                    }
                }(poi, poiMarker)).mouseleave(function(thePoi, theMarker) {
                    return function() {
                        theMarker.closePopup();
                        theMarker.setIcon(theMarker.smallIcon);
                    }
                }(poi, poiMarker));
            }
            poiMarker.bindPopup(poi.name).on('click', function(e) {
                e.target.openPopup();
                e.target.setIcon(e.target.bigIcon);
            }).on('popupclose', function(e) {
                e.target.setIcon(e.target.smallIcon);
            });
            n++;
        }
        if (n == 0)
            $("#noResults").show();
    },

    _formatTime : function(timeSec) {
        return (timeSec / 60).toFixed(0) + "mn";
    }
});
