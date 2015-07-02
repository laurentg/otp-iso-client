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

otp.client.Pois = otp.Class({

    /**
     * Create a new POI source.
     */
    initialize : function(config) {
        var thisPo = this;
        this.config = config;
        this.loadCountdown = this.config.ids.length;
        this.onLoadCallbacks = $.Callbacks();
        this.pois = [];
        for (var i = 0; i < this.config.ids.length; i++) {
            var id = this.config.ids[i];
            jQuery.ajax(this.config.url + id + "/Objects", {
                dataType : 'json',
                accepts : {
                    json : 'application/json'
                },
                failure : function() {
                    thisPo.loadCountdown--;
                },
                success : function(res) {
                    for (var j = 0; j < res.value.length; j++) {
                        var poi = res.value[j];
                        if (!isNaN(parseFloat(poi.GmapLatitude)) && !isNaN(parseFloat(poi.GmapLongitude))) {
                            var type = "MISC";
                            if (poi.ObjectTypeName == "Hôtellerie")
                                type = "HOTEL";
                            if (poi.ObjectTypeName == "Hôtellerie de plein air")
                                type = "CAMPING";
                            else if (poi.ObjectTypeName == "Restauration")
                                type = "RESTAURANT";
                            else if (poi.ObjectTypeName == "Patrimoine culturel")
                                type = "CULTURE";
                            var mpoi = {
                                type : type,
                                name : poi.SyndicObjectName,
                                location : L.latLng(poi.GmapLatitude, poi.GmapLongitude)
                            };
                            thisPo.pois.push(mpoi);
                        }
                    }
                    thisPo.loadCountdown--;
                    if (thisPo.loadCountdown == 0) {
                        thisPo.onLoadCallbacks.fire(thisPo);
                    }
                }
            });
        }
    },

    /**
     * Return true if all the POIs are loaded.
     */
    isLoaded : function() {
        return this.loadCountdown == 0;
    },

    /**
     * Return the loaded POIs.
     */
    getPois : function() {
        return this.pois;
    },

    /**
     * Add a callback when refreshed.
     */
    onLoad : function(callback) {
        this.onLoadCallbacks.add(callback);
        return this;
    },

    /**
     * Return the list of POI types.
     */
    getPoiTypes : function() {
        return [ 'CULTURE', 'HOTEL', 'CAMPING', 'RESTAURANT' ];
    }

});
