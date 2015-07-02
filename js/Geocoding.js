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

otp.client.Geocoder = otp.Class({

    /**
     * Create a new geocoder.
     */
    initialize : function(config) {
        var thisGeo = this;
        this.config = config;
        this.baseUrl = "http://open.mapquestapi.com";
        this.onReverseGeocodeCallbacks = $.Callbacks();
    },

    /**
     * Reverse-geocode a position.
     */
    reverseGeocode : function(position) {
        var thisGeo = this;
        var params = {
                key : this.config.key,
                location : position.lat + "," + position.lng
        }
        jQuery.ajax(this.baseUrl + "/geocoding/v1/reverse", {
            data : params,
            dataType : 'jsonp',
            success : function(res) {
                if (res.results[0].locations.length > 0) {
                    var loc = res.results[0].locations[0];
                    var addr = loc.street + ", " + loc.adminArea5;
                    thisGeo.onReverseGeocodeCallbacks.fire(addr);
                }
            }
        });
    },
    
    /**
     * Add a callback when reverse geocoding done.
     */
    onReverseGeocode : function(callback) {
        this.onReverseGeocodeCallbacks.add(callback);
        return this;
    }
});
